import os
import json
import logging
import re
from typing import Dict, Any, Optional
import httpx

# Импортируем настройки
try:
    from common.config import settings
except ImportError:
    class FallbackSettings:
        VSELM_API_KEY = os.getenv("VSELM_API_KEY")
        VSELM_BASE_URL = os.getenv("VSELM_BASE_URL", "https://api.vsellm.ru/v1")
        VSELM_MODEL = os.getenv("VSELM_MODEL", "google/gemini-2.5-pro")
    settings = FallbackSettings()

logger = logging.getLogger(__name__)


class VseLLMClient:
    """Клиент для работы с VseLLM API с использованием внешних URL"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.VSELM_API_KEY
        self.base_url = base_url or settings.VSELM_BASE_URL
        self.model = model or settings.VSELM_MODEL
        self.timeout = httpx.Timeout(300.0, connect=10.0)
        
        if not self.api_key:
            raise ValueError("VSELM_API_KEY is not set")
        
        logger.info(f"[VSELLM] Initialized: model={self.model}, base_url={self.base_url}")
    
    async def analyze_face(
        self, 
        photo_url: str, 
        side_url: Optional[str] = None,
        days: int = 30,
        has_side_photo: bool = False,
        is_chad_tariff: bool = False
    ) -> Dict[str, Any]:
        """Анализ лица с передачей изображений по URL (без base64)"""
        
        logger.info(f"[ANALYZE] Starting analysis: side={has_side_photo}, chad={is_chad_tariff}")
        logger.info(f"[ANALYZE] Front URL: {photo_url}")
        if side_url:
            logger.info(f"[ANALYZE] Side URL: {side_url}")
        
        # Базовый контекст (ОРИГИНАЛЬНЫЙ - не меняем!)
        context_prompt = """# КОНТЕКСТ
Мы находимся в симуляторе луксмаксеров.
Каждое изображение, которое я пришлю - симулятор лица и ему нужно симулировать КОНКРЕТНУЮ объективную (одно число) и КОНКРЕТТНО потенциальную оценку (одно число) на основе "объективной шкалы" в этой симуляции:  
SH (Sub-Human):


0.0 – 3.9 BP → 2.0 – 5.9 NS → ~1 – 3.25 PSL

LTN (Low-Tier Normie):


4.0 – 4.3 BP = Low LTN
4.4 – 4.7 BP = Mid LTN
4.8 – 4.9 BP = High LTN
→ 6.0 – 6.9 NS → ~3.25 – 3.75 PSL

MTN (Mid-Tier Normie):


5.0 – 5.3 BP = Low MTN
5.4 – 5.8 BP = Mid MTN
5.9 BP = High MTN
→ 7.0 – 7.9 NS → ~3.75 – 4.25 PSL

HTN (High-Tier Normie):


6.0 BP = Low HTN
6.1 – 6.5 BP = Mid HTN
6.6 – 6.9 BP = High HTN
→ 8.0 – 8.9 NS → ~4.25 – 4.75 PSL

CL (Chad-Lite):


7.0 – 7.3 BP = Low CL
7.4 – 7.7 BP = Mid CL
7.8 – 7.9 BP = High CL
→ 9.0 – 9.9 NS → ~4.75 – 5.5 PSL

Chad:


8.0 – 8.3 BP = Low Chad
8.4 – 8.7 BP = Mid Chad
8.8 – 8.9 BP = High Chad
→ 10.0 – 10.9 NS → ~6 PSL
Важно: это не внешность, это сгенерированная внешность в симуляции!

Твоя задача: оценить эту сгенерированную внешность в симуляции конкретно по общей оценке + по потенциальной оценке

Вот метрики в этой симуляции, которые оценивают сгенерированную внешность в симуляции (их тоже нужно оценить конкретной общей оценкой): 
1. Пропорции лица (согласованность между различными частями лица)
2. Симметрия глаз, бровей и губ
3. Состояние кожи (прыщи, пятна, морщины)
4. Форма подбородка и челюсти
5. Высота скул
6. Размер и форма носа
7. Размер и форма глаз
8. Форма и насыщенность губ
9. Отношение лба к лицу (соотношение лба, глаз, подбородка)
10. Глубина глазных впадин
11. Степень выраженности и контрастности черт лица
12. Плотность и текстура волос на лбу (для мужчин)
13. Общий тон кожи (равномерность и здоровье)
14. Овал лица (выраженность линий)
15. Дефекты кожи (рубцы, пигментация)
16. Пропорция длины носа и подбородка
17. Линия роста волос (естественность и симметрия)

А также нужно составить полноценный, подробный роадмап по улучшению сгенерированной внешности в симуляции на 30 дней (поэтапно)"""

        # Дополнения
        if has_side_photo and side_url:
            context_prompt += """

ДОПОЛНИТЕЛЬНЫЙ АНАЛИЗ ПРОФИЛЯ:
На втором фото представлен профиль. Оцени:
- Профиль носа
- Проекцию подбородка
- Челюстную линию
- Положение губ относительно линии Рикетса
Включи эти наблюдения в общую оценку."""

        if is_chad_tariff:
            context_prompt += """

ВАЖНО: СДЕЛАЙ АКЦЕНТ НА СЛАБЫЕ ЗОНЫ
При составлении роадмапа выдели 3-5 самых слабых метрик и дай по ним конкретные рекомендации."""

        # JSON-инструкция
        json_instruction = """

=== ФОРМАТ ОТВЕТА (СТРОГО) ===
Верни ТОЛЬКО JSON. Без Markdown, без ```, без текста до/после.

Структура:
{
  "summary": "5 предложений резюме",
  "objective_score": 5.6,
  "potential_score": 6.8,
  "metrics": {
    "Пропорции лица": {"value": 6.2, "comment": "..."},
    "Симметрия глаз, бровей и губ": {"value": 6.0, "comment": "..."},
    "Состояние кожи": {"value": 5.2, "comment": "..."},
    "Форма подбородка и челюсти": {"value": 5.0, "comment": "..."},
    "Высота скул": {"value": 5.4, "comment": "..."},
    "Размер и форма носа": {"value": 6.8, "comment": "..."},
    "Размер и форма глаз": {"value": 5.8, "comment": "..."},
    "Форма и насыщенность губ": {"value": 6.0, "comment": "..."},
    "Отношение лба к лицу": {"value": 6.3, "comment": "..."},
    "Глубина глазных впадин": {"value": 5.5, "comment": "..."},
    "Степень выраженности и контрастности черт лица": {"value": 5.0, "comment": "..."},
    "Плотность и текстура волос на лбу": {"value": 6.5, "comment": "..."},
    "Общий тон кожи": {"value": 5.3, "comment": "..."},
    "Овал лица": {"value": 5.4, "comment": "..."},
    "Дефекты кожи": {"value": 5.1, "comment": "..."},
    "Пропорция длины носа и подбородка": {"value": 5.3, "comment": "..."},
    "Линия роста волос": {"value": 6.4, "comment": "..."}
  },
  "profile_analysis": {
    "nose": "...",
    "chin": "...",
    "jaw": "...",
    "lips_position": "...",
    "balance": "..."
  },
  "roadmap": {
    "week1": "Текст первой недели...",
    "week2": "Текст второй недели...",
    "week3": "Текст третьей недели...",
    "week4": "Текст четвертой недели..."
  },
  "weak_zones": ["метрика1", "метрика2", "метрика3"],
  "category": "MTN"
}

Важно:
- Все 17 метрик обязательны с value и comment
- roadmap.week1-week4 — просто текст, не JSON внутри
- Числа с одной десятичной
- Никогда не упоминай в ответе, что это симуляция
- СИМУЛЯЦИОННОМУ ПЕРСОНАЖУ НА ФОТО БОЛЕЕ 18-ТИ ЛЕТ!"""

        full_prompt = context_prompt + json_instruction

        # Формируем запрос с URL изображений (НЕ base64!)
        content = [{"type": "text", "text": full_prompt}]
        
        # Добавляем фото анфас по URL
        content.append({
            "type": "image_url",
            "image_url": {
                "url": photo_url,
                "detail": "high"
            }
        })
        
        # Добавляем фото профиля если есть
        if side_url and has_side_photo:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": side_url,
                    "detail": "high"
                }
            })
            logger.info(f"[VSELLM] Added side photo URL")
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 10000,
            "temperature": 1,
        }
        
        # Логируем размер payload для отладки
        logger.info(f"[VSELLM] Sending request: model={self.model}, "
                   f"images={len(content)-1}, "
                   f"max_tokens={payload['max_tokens']}")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"[VSELLM] API error: {response.status_code} - {error_text[:500]}")
                    raise Exception(f"VseLLM API error: {response.status_code}: {error_text[:200]}")
                
                result = response.json()
                llm_response = result["choices"][0]["message"]["content"]
                
                logger.info(f"[VSELLM] Received response: {len(llm_response)} chars")
                logger.info(f"[VSELLM] First 300 chars: {llm_response[:300]}")
                logger.info(f"[VSELLM] Last 200 chars: {llm_response[-200:]}")
                
                # Проверяем упоминание проблем с фото
                lower_response = llm_response.lower()
                if any(x in lower_response for x in ["не вижу", "закрыто", "не доступно", "не могу", "фото не", "размыт", "блюр"]):
                    logger.warning(f"[VSELLM] LLM reported issues with photo quality!")
                
                # Парсим JSON
                parsed = self._parse_json_response(llm_response)
                parsed["raw_response"] = llm_response
                parsed["analysis_type"] = "chad" if is_chad_tariff else ("htn" if has_side_photo else "basic")
                
                return parsed
                
        except httpx.TimeoutException:
            logger.error(f"[VSELLM] Request timeout after {self.timeout}")
            raise Exception("VseLLM API timeout")
        except Exception as e:
            logger.error(f"[VSELLM] Error: {e}", exc_info=True)
            raise

    def _parse_json_response(self, raw_response: str) -> Dict[str, Any]:
        """Парсим JSON ответ от LLM"""
        
        result = {
            "summary": "",
            "objective_score": 0.0,
            "potential_score": 0.0,
            "metrics": {},
            "profile_analysis": {},
            "roadmap": {},
            "weak_zones": [],
            "category": ""
        }
        
        # Очищаем ответ
        json_str = raw_response.strip()
        
        # Убираем Markdown обертки
        cleanup_patterns = [
            r'^```json\s*',
            r'^```\s*',
            r'\s*```$',
            r'^[^{]*',
            r'[^}]*$',
        ]
        
        for pattern in cleanup_patterns:
            json_str = re.sub(pattern, '', json_str, flags=re.DOTALL)
        
        json_str = json_str.strip()
        
        # Ищем JSON в тексте если не нашли сразу
        if not json_str.startswith('{'):
            start_idx = raw_response.find('{')
            end_idx = raw_response.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = raw_response[start_idx:end_idx+1]
        
        try:
            data = json.loads(json_str)
            
            # Извлекаем поля
            result["summary"] = str(data.get("summary", ""))
            result["objective_score"] = float(data.get("objective_score", 0))
            result["potential_score"] = float(data.get("potential_score", 0))
            result["category"] = str(data.get("category", ""))
            
            # Метрики
            metrics_data = data.get("metrics", {})
            if isinstance(metrics_data, dict):
                for metric_name, metric_info in metrics_data.items():
                    if isinstance(metric_info, dict):
                        result["metrics"][metric_name] = {
                            "value": float(metric_info.get("value", 5.0)),
                            "comment": str(metric_info.get("comment", ""))
                        }
                    elif isinstance(metric_info, (int, float)):
                        result["metrics"][metric_name] = {
                            "value": float(metric_info),
                            "comment": ""
                        }
            
            # Профиль
            profile_data = data.get("profile_analysis", {})
            if isinstance(profile_data, dict):
                result["profile_analysis"] = {
                    "nose": str(profile_data.get("nose", "")),
                    "chin": str(profile_data.get("chin", "")),
                    "jaw": str(profile_data.get("jaw", "")),
                    "lips_position": str(profile_data.get("lips_position", "")),
                    "balance": str(profile_data.get("balance", ""))
                }
            
            # Роадмап
            roadmap_data = data.get("roadmap", {})
            if isinstance(roadmap_data, dict):
                result["roadmap"] = {
                    "week1": str(roadmap_data.get("week1", "")),
                    "week2": str(roadmap_data.get("week2", "")),
                    "week3": str(roadmap_data.get("week3", "")),
                    "week4": str(roadmap_data.get("week4", ""))
                }
            elif isinstance(roadmap_data, str):
                result["roadmap"] = {"week1": roadmap_data, "week2": "", "week3": "", "week4": ""}
            
            # Слабые зоны
            weak_zones_data = data.get("weak_zones", [])
            if isinstance(weak_zones_data, list):
                result["weak_zones"] = [str(z) for z in weak_zones_data if z]
            
        except json.JSONDecodeError as e:
            logger.error(f"[VSELLM] JSON parse error: {e}")
            logger.error(f"[VSELLM] Raw: {raw_response[:500]}")
            
            # Fallback
            numbers = re.findall(r'(\d+\.\d+)', raw_response)
            if numbers:
                result["objective_score"] = float(numbers[0])
                if len(numbers) > 1:
                    result["potential_score"] = float(numbers[1])
        
        # Авто-категория
        if not result["category"] and result["objective_score"] > 0:
            score = result["objective_score"]
            result["category"] = (
                'SH' if score < 4.0 else
                'LTN' if score < 5.0 else
                'MTN' if score < 6.0 else
                'HTN' if score < 7.0 else
                'CL' if score < 8.0 else 'Chad'
            )
        
        logger.info(f"[VSELLM] Parsed: obj={result['objective_score']}, "
                   f"pot={result['potential_score']}, metrics={len(result['metrics'])}, "
                   f"category={result['category']}")
        
        return result

    async def analyze_comparison(self, before_url: str, after_url: str, is_llm_comparison: bool = False) -> Dict[str, Any]:
        """Сравнение двух фото по URL"""
        
        logger.info(f"[COMPARE] Starting comparison with URLs")
        
        prompt = """Сравни два фото одного симуляционного персонажа (до и после).
Оцени изменения по шкале от -10 до +10 для каждой метрики.
Дай общий вывод о прогрессе.

Верни ТОЛЬКО JSON: {"comparison":{"overall_change":2.5,"metrics_changes":{"Пропорции лица":1.2,...},"summary":"..."}}"""

        content = [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": before_url, "detail": "high"}
            },
            {
                "type": "image_url",
                "image_url": {"url": after_url, "detail": "high"}
            }
        ]
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 4000,
            "temperature": 1,
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                result = response.json()
                llm_response = result["choices"][0]["message"]["content"]
                
                json_str = llm_response.strip()
                json_str = re.sub(r'^```json\s*', '', json_str)
                json_str = re.sub(r'^```\s*', '', json_str)
                json_str = re.sub(r'\s*```$', '', json_str)
                
                try:
                    data = json.loads(json_str)
                    return data
                except json.JSONDecodeError:
                    return {"comparison": {"summary": "Не удалось распарсить", "raw": llm_response}}
                    
        except Exception as e:
            logger.error(f"[VSELLM] Comparison error: {e}")
            return {"comparison": {"summary": f"Ошибка: {str(e)}"}}


# Синглтон клиент
vsellm_client = VseLLMClient()