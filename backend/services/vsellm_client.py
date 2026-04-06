import os
import json
import logging
import re
import base64
from typing import Dict, Any, Optional, Tuple
from io import BytesIO
from PIL import Image
import httpx

# Импортируем настройки
try:
    from common.config import settings
except ImportError:
    class FallbackSettings:
        VSELM_API_KEY = os.getenv("VSELM_API_KEY")
        VSELM_BASE_URL = os.getenv("VSELM_BASE_URL", "https://api.vsellm.ru/v1")
        VSELM_MODEL = os.getenv("VSELM_MODEL", "openai/gpt-5.1")
    settings = FallbackSettings()

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Обработка изображений для Vision API - гарантированное качество"""
    
    @staticmethod
    def prepare_base64(image_url_or_path: str, max_size: Tuple[int, int] = (2048, 2048)) -> str:
        """
        Конвертирует изображение в base64 с контролем качества.
        Поддерживает URL и локальные пути.
        
        Args:
            image_url_or_path: URL изображения или локальный путь
            max_size: Максимальный размер (ширина, высота) после ресайза
            
        Returns:
            base64 строка с data:image/jpeg;base64 префиксом
        """
        try:
            # Загружаем изображение
            if image_url_or_path.startswith(('http://', 'https://')):
                # URL - скачиваем
                import httpx
                with httpx.Client(timeout=30.0) as client:
                    response = client.get(image_url_or_path)
                    response.raise_for_status()
                    image_data = response.content
                image = Image.open(BytesIO(image_data))
            else:
                # Локальный файл
                image = Image.open(image_url_or_path)
            
            # Конвертируем в RGB (убираем альфа-канал)
            if image.mode in ('RGBA', 'LA', 'P'):
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = rgb_image
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Ресайз до 2048px по большей стороне (оптимально для GPT-Vision)
            if max(image.size) > max(max_size):
                ratio = max_size[0] / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"[IMAGE] Resized from {image.size} to {new_size}")
            
            # Сохраняем в буфер с quality=95 (без optimize)
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=95, optimize=False, progressive=False)
            buffer.seek(0)
            
            # Кодируем в base64
            b64_encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
            size_kb = len(b64_encoded) * 3 / 4 / 1024  # Приблизительный размер
            
            logger.info(f"[IMAGE] Base64 prepared: {size_kb:.0f}KB, "
                       f"dimensions: {image.size[0]}x{image.size[1]}")
            
            return f"data:image/jpeg;base64,{b64_encoded}"
            
        except Exception as e:
            logger.error(f"[IMAGE] Failed to prepare base64: {e}", exc_info=True)
            raise ValueError(f"Failed to process image: {str(e)}")
    
    @staticmethod
    def get_image_info(image_url_or_path: str) -> Dict[str, Any]:
        """Получает информацию об изображении без загрузки в память"""
        try:
            if image_url_or_path.startswith(('http://', 'https://')):
                import httpx
                with httpx.Client(timeout=30.0) as client:
                    response = client.head(image_url_or_path)
                    content_type = response.headers.get('content-type', '')
                    content_length = response.headers.get('content-length', 0)
                return {
                    'type': 'url',
                    'content_type': content_type,
                    'size_bytes': int(content_length) if content_length else 0
                }
            else:
                stat = os.stat(image_url_or_path)
                return {
                    'type': 'local',
                    'size_bytes': stat.st_size
                }
        except Exception as e:
            logger.warning(f"[IMAGE] Failed to get info: {e}")
            return {'error': str(e)}


class VseLLMClient:
    """Клиент для работы с VseLLM API с поддержкой base64 изображений"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.VSELM_API_KEY
        self.base_url = base_url or settings.VSELM_BASE_URL
        self.model = model or settings.VSELM_MODEL
        self.timeout = httpx.Timeout(300.0, connect=10.0)
        self.image_processor = ImageProcessor()
        
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
        """Анализ лица с передачей изображений в base64"""
        
        logger.info(f"[ANALYZE] Starting analysis: side={has_side_photo}, chad={is_chad_tariff}")
        
        # Конвертируем изображения в base64 синхронно (PIL операции)
        try:
            # Используем run_in_executor для неблокирующей обработки
            import asyncio
            loop = asyncio.get_event_loop()
            
            front_base64 = await loop.run_in_executor(
                None, self.image_processor.prepare_base64, photo_url
            )
            logger.info(f"[ANALYZE] Front image converted to base64")
            
            side_base64 = None
            if side_url and has_side_photo:
                side_base64 = await loop.run_in_executor(
                    None, self.image_processor.prepare_base64, side_url
                )
                logger.info(f"[ANALYZE] Side image converted to base64")
                
        except Exception as e:
            logger.error(f"[ANALYZE] Failed to prepare images: {e}", exc_info=True)
            raise Exception(f"Image processing failed: {str(e)}")
        
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
- СИМУЛЯЦИОННОМУ ПЕРСОНАЖУ НА ФОТО БОЛЕЕ 18-ТИ ЛЕТ!"""

        full_prompt = context_prompt + json_instruction

        # Формируем запрос с base64 изображениями
        content = [{"type": "text", "text": full_prompt}]
        
        # Добавляем фото анфас в base64
        content.append({
            "type": "image_url",
            "image_url": {
                "url": front_base64,
                "detail": "high"
            }
        })
        
        # Добавляем фото профиля если есть
        if side_base64 and has_side_photo:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": side_base64,
                    "detail": "high"
                }
            })
            logger.info(f"[VSELLM] Added side photo (base64)")
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 10000,
            "temperature": 1,
        }
        
        # Логируем размер payload для отладки
        payload_size = len(json.dumps(payload))
        logger.info(f"[VSELLM] Sending request: model={self.model}, "
                   f"images={len(content)-1}, payload_size={payload_size//1024}KB, "
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
        """Сравнение двух фото с использованием base64"""
        
        logger.info(f"[COMPARE] Starting comparison with base64")
        
        # Конвертируем оба изображения в base64
        import asyncio
        loop = asyncio.get_event_loop()
        
        try:
            before_base64 = await loop.run_in_executor(
                None, self.image_processor.prepare_base64, before_url
            )
            after_base64 = await loop.run_in_executor(
                None, self.image_processor.prepare_base64, after_url
            )
            logger.info(f"[COMPARE] Both images converted to base64")
        except Exception as e:
            logger.error(f"[COMPARE] Failed to prepare images: {e}")
            raise Exception(f"Image processing failed: {str(e)}")
        
        prompt = """Сравни два фото одного симуляционного персонажа (до и после).
Оцени изменения по шкале от -10 до +10 для каждой метрики.
Дай общий вывод о прогрессе.

Верни ТОЛЬКО JSON: {"comparison":{"overall_change":2.5,"metrics_changes":{"Пропорции лица":1.2,...},"summary":"..."}}"""

        content = [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": before_base64, "detail": "high"}
            },
            {
                "type": "image_url",
                "image_url": {"url": after_base64, "detail": "high"}
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