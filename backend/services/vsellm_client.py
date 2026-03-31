# backend/services/vsellm_client.py
import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from urllib.parse import quote

# Импортируем настройки (создадим fallback если common.config еще не готов)
try:
    from common.config import settings
except ImportError:
    class FallbackSettings:
        VSELM_API_KEY = os.getenv("VSELM_API_KEY")
        VSELM_BASE_URL = os.getenv("VSELM_BASE_URL", "https://api.vsellm.ru/v1")
        VSELM_MODEL = os.getenv("VSELM_MODEL", "openai/gpt-5.2")
    settings = FallbackSettings()

logger = logging.getLogger(__name__)

class VseLLMClient:
    """Клиент для работы с VseLLM API"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.VSELM_API_KEY
        self.base_url = base_url or settings.VSELM_BASE_URL
        self.model = model or settings.VSELM_MODEL
        self.timeout = httpx.Timeout(300.0, connect=10.0)
        
        if not self.api_key:
            raise ValueError("VSELM_API_KEY is not set")
        
    async def analyze_face(
        self, 
        photo_url: str, 
        days: int = 30,
    ) -> Dict[str, Any]:
        
        prompt = f""" Привет

"""

        payload = {
            "model": self.model, 
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": photo_url  
                        }
                    ]
                }
            ],
            "max_tokens": 10000,
            "temperature": 1,
        }

        # Логируем payload для отладки (без полного промпта)
        logger.info(f"Payload prepared: model={payload['model']}, photo_url={photo_url}, max_tokens={payload['max_tokens']}")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            logger.info(f"Sending request to VseLLM API")
            logger.info(f"Photo URL: {photo_url}")
            
            # Проверяем доступность фото перед отправкой в LLM
            try:
                async with httpx.AsyncClient(timeout=10.0) as test_client:
                    test_response = await test_client.head(photo_url, follow_redirects=True)
                    logger.info(f"Photo check before LLM: status={test_response.status_code}, content-type={test_response.headers.get('content-type')}")
                    
                    if test_response.status_code != 200:
                        logger.error(f"PHOTO NOT ACCESSIBLE! Status: {test_response.status_code}")
                        # Можно также скачать фото для проверки
                        download_resp = await test_client.get(photo_url, timeout=10.0)
                        logger.info(f"Download test: length={len(download_resp.content)} bytes")
                        
            except Exception as test_e:
                logger.error(f"Photo URL test failed: {test_e}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"VseLLM API error: {response.status_code} - {response.text}")
                    raise Exception(f"VseLLM API error: {response.status_code}")
                
                result = response.json()
                llm_response = result["choices"][0]["message"]["content"]
                
                logger.info(f"Received LLM response, length: {len(llm_response)} chars")
                logger.info(f"Response first 200 chars: {llm_response[:200]}")
                logger.info(f"Response last 200 chars: {llm_response[-200:]}")

                # Проверяем, есть ли в ответе упоминание фото
                if "не вижу" in llm_response.lower() or "фото" in llm_response.lower():
                    logger.warning(f"LLM might not see the photo! Response contains photo-related keywords")
                
                # Парсим структурированный ответ
                parsed = self._parse_response(llm_response)
                parsed["raw_response"] = llm_response
                
                return parsed
                
        except Exception as e:
            logger.error(f"VseLLM API error: {str(e)}")
            raise

    def _parse_response(self, raw_response: str) -> Dict[str, Any]:
        """Парсим структурированный ответ от LLM"""
        result = {
            "summary": "",
            "objective_score": 0.0,
            "potential_score": 0.0,
            "metrics": {},
            "roadmap": "",
            "category": ""
        }
        
        lines = raw_response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Резюме
            if line.startswith('1. ') and 'резюме' in line.lower():
                current_section = 'summary'
                continue
            elif current_section == 'summary' and line and not line.startswith('2. '):
                result['summary'] += line + ' '
                
            # Объективная оценка
            elif line.startswith('2. ') or 'объективная оценка' in line.lower():
                current_section = 'objective'
                # Ищем число в строке
                import re
                match = re.search(r'(\d+\.?\d*)', line)
                if match:
                    result['objective_score'] = float(match.group(1))
                    
            # Потенциальная оценка
            elif line.startswith('3. ') or 'потенциальная оценка' in line.lower():
                current_section = 'potential'
                import re
                match = re.search(r'(\d+\.?\d*)', line)
                if match:
                    result['potential_score'] = float(match.group(1))
                    
            # Метрики (4.)
            elif line.startswith('4. ') or 'метрик' in line.lower():
                current_section = 'metrics'
                continue
            elif current_section == 'metrics' and line.startswith('- '):
                # Парсим метрику: "- Пропорции лица: 6.8/10 (комментарий)"
                import re
                match = re.match(r'- ([\w\s]+):\s*(\d+\.?\d*)/10\s*\((.*)\)', line)
                if match:
                    metric_name = match.group(1).strip()
                    metric_value = float(match.group(2))
                    metric_comment = match.group(3).strip()
                    result['metrics'][metric_name] = {
                        "value": metric_value,
                        "comment": metric_comment
                    }
                    
            # Роадмап (5.)
            elif line.startswith('5. ') or 'роадмап' in line.lower():
                current_section = 'roadmap'
                continue
            elif current_section == 'roadmap':
                result['roadmap'] += line + '\n'
        
        # Определяем категорию по objective_score
        score = result['objective_score']
        if score < 4.0:
            result['category'] = 'SH'
        elif score < 5.0:
            result['category'] = 'LTN'
        elif score < 6.0:
            result['category'] = 'MTN'
        elif score < 7.0:
            result['category'] = 'HTN'
        elif score < 8.0:
            result['category'] = 'CL'
        else:
            result['category'] = 'Chad'
            
        result['summary'] = result['summary'].strip()
        result['roadmap'] = result['roadmap'].strip()
        
        return result

# Синглтон клиент
vsellm_client = VseLLMClient()