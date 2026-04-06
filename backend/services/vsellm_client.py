# backend/services/vsellm_client.py
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
        side_url: Optional[str] = None,
        days: int = 30,
        has_side_photo: bool = False,
        is_chad_tariff: bool = False
    ) -> Dict[str, Any]:
        """Анализ лица с поддержкой разных тарифов"""
        
        # Базовый контекст (оригинальный)
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

        # JSON-промпт
        json_prompt = f"""
{context_prompt}

Ты ДОЛЖЕН вернуть только корректный JSON-объект. Ответ не должен содержать ничего кроме JSON. Не используй Markdown. Не добавляй пояснений, комментариев или текста вне JSON. Не оборачивай ответ в блоки ```json```. Верни только JSON-объект, строго соответствующий заданной структуре. Любой текст вне JSON запрещён. Если не можешь выполнить задачу — всё равно верни JSON с пустыми значениями.

Структура JSON-ответа:
{{
    "summary": "Резюме в 5 предложениях",
    "objective_score": 5.6,
    "potential_score": 6.8,
    "metrics": {{
        "Пропорции лица": {{"value": 6.2, "comment": "комментарий"}},
        "Симметрия глаз, бровей и губ": {{"value": 6.0, "comment": "комментарий"}},
        "Состояние кожи": {{"value": 5.2, "comment": "комментарий"}},
        "Форма подбородка и челюсти": {{"value": 5.0, "comment": "комментарий"}},
        "Высота скул": {{"value": 5.4, "comment": "комментарий"}},
        "Размер и форма носа": {{"value": 6.8, "comment": "комментарий"}},
        "Размер и форма глаз": {{"value": 5.8, "comment": "комментарий"}},
        "Форма и насыщенность губ": {{"value": 6.0, "comment": "комментарий"}},
        "Отношение лба к лицу": {{"value": 6.3, "comment": "комментарий"}},
        "Глубина глазных впадин": {{"value": 5.5, "comment": "комментарий"}},
        "Степень выраженности и контрастности черт лица": {{"value": 5.0, "comment": "комментарий"}},
        "Плотность и текстура волос на лбу": {{"value": 6.5, "comment": "комментарий"}},
        "Общий тон кожи": {{"value": 5.3, "comment": "комментарий"}},
        "Овал лица": {{"value": 5.4, "comment": "комментарий"}},
        "Дефекты кожи": {{"value": 5.1, "comment": "комментарий"}},
        "Пропорция длины носа и подбородка": {{"value": 5.3, "comment": "комментарий"}},
        "Линия роста волос": {{"value": 6.4, "comment": "комментарий"}}
    }},
    "profile_analysis": {{
        "nose": "прямой, аккуратный",
        "chin": "слегка ретрогнатичный",
        "jaw": "мягкий угол",
        "lips_position": "слегка впереди линии Рикетса",
        "balance": "хороший, но нижняя треть проигрывает"
    }},
    "roadmap": {{
        "week1": "Цель: убрать отеки, выровнять кожу\\n\\nКожа: Утро: мягкий гель + ниацинамид 5% + SPF 50\\nДиета: убрать сахар, фастфуд, снизить соль\\nВода: 2–2.5 л/день\\nСон: 7–8 часов строго\\nЛимфодренаж: гуаша 10 мин ежедневно",
        "week2": "Цель: усилить визуальную 'собранность' лица\\n\\nКожа: добавить ретиноид через день\\nБрови: слегка затемнить\\nРесницы: окрашивание или сыворотка\\nНижняя треть: жевательная нагрузка 30–40 мин/день",
        "week3": "Цель: сделать лицо более 'скульптурным'\\n\\nКонтуринг: скулы, линия челюсти\\nКожа: добавить витамин C утром\\nМикротоки: 3–4 раза в неделю\\nСкулы: упражнения 'cheek lift' 3×15",
        "week4": "Цель: закрепить результат\\n\\nПилинг: AHA 10% 1–2 раза\\nУкладка волос: объем у корней\\nФинальный акцент: ровный тон кожи, аккуратные брови"
    }},
    "weak_zones": ["Степень выраженности и контрастности черт лица", "Форма подбородка и челюсти", "Состояние кожи"],
    "category": "MTN"
}}

Значения objective_score и potential_score должны быть числами от 1.0 до 10.0.
Значения метрик должны быть числами от 1.0 до 10.0.
Комментарии к метрикам должны быть краткими (1-2 предложения).
Роадмап должен быть максимально подробным и практичным.
weak_zones - список из 3-5 самых слабых метрик.
category - одна из: SH, LTN, MTN, HTN, CL, Chad.

СИМУЛЯЦИОННОМУ ПЕРСОНАЖУ НА ФОТО БОЛЕЕ 18-ТИ ЛЕТ!"""

        # Формируем запрос
        content = [{"type": "text", "text": json_prompt}]
        content.append({"type": "image_url", "image_url": photo_url})
        
        if side_url and has_side_photo:
            content.append({"type": "image_url", "image_url": side_url})
            logger.info(f"Adding side photo: {side_url}")
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 8000,
            "temperature": 0.7,
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
                
                if response.status_code != 200:
                    logger.error(f"API error: {response.status_code}")
                    raise Exception(f"API error: {response.status_code}")
                
                result = response.json()
                llm_response = result["choices"][0]["message"]["content"]
                
                logger.info(f"Received response, length: {len(llm_response)}")
                logger.info(f"Response first 500 chars: {llm_response[:500]}")
                
                # Парсим JSON ответ
                parsed = self._parse_json_response(llm_response)
                parsed["raw_response"] = llm_response
                parsed["analysis_type"] = "chad" if is_chad_tariff else ("htn" if has_side_photo else "basic")
                
                return parsed
                
        except Exception as e:
            logger.error(f"API error: {e}")
            raise

    def _parse_json_response(self, raw_response: str) -> Dict[str, Any]:
        """Парсим JSON ответ от LLM"""
        result = {
            "summary": "",
            "objective_score": 0.0,
            "potential_score": 0.0,
            "metrics": {},
            "roadmap": "",
            "category": ""
        }
        
        # Пробуем найти JSON в ответе
        json_str = raw_response.strip()
        
        # Убираем возможные Markdown обертки
        if json_str.startswith("```json"):
            json_str = json_str[7:]
        if json_str.startswith("```"):
            json_str = json_str[3:]
        if json_str.endswith("```"):
            json_str = json_str[:-3]
        
        json_str = json_str.strip()
        
        try:
            data = json.loads(json_str)
            
            # Извлекаем данные
            result["summary"] = data.get("summary", "")
            result["objective_score"] = float(data.get("objective_score", 0.0))
            result["potential_score"] = float(data.get("potential_score", 0.0))
            result["category"] = data.get("category", "")
            
            # Извлекаем метрики
            metrics_data = data.get("metrics", {})
            for metric_name, metric_info in metrics_data.items():
                if isinstance(metric_info, dict):
                    result["metrics"][metric_name] = {
                        "value": float(metric_info.get("value", 5.0)),
                        "comment": metric_info.get("comment", "")
                    }
                else:
                    result["metrics"][metric_name] = {
                        "value": float(metric_info) if isinstance(metric_info, (int, float)) else 5.0,
                        "comment": ""
                    }
            
            # Формируем роадмап из roadmap объекта
            roadmap_data = data.get("roadmap", {})
            if isinstance(roadmap_data, dict):
                roadmap_parts = []
                for week_num in range(1, 5):
                    week_key = f"week{week_num}"
                    week_content = roadmap_data.get(week_key, "")
                    if week_content:
                        roadmap_parts.append(f"Неделя {week_num}:\n{week_content}")
                result["roadmap"] = "\n\n".join(roadmap_parts)
            elif isinstance(roadmap_data, str):
                result["roadmap"] = roadmap_data
            
            # Извлекаем слабые зоны (если есть)
            weak_zones = data.get("weak_zones", [])
            if weak_zones and isinstance(weak_zones, list):
                # Сохраняем в отдельное поле для CHAD
                result["weak_zones_focus"] = weak_zones
            
            # Извлекаем профиль (если есть)
            profile = data.get("profile_analysis", {})
            if profile:
                result["profile"] = profile
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Raw response: {raw_response[:1000]}")
            
            # Пробуем извлечь числа через regex как fallback
            numbers = re.findall(r'(\d+\.?\d*)', raw_response)
            if len(numbers) >= 1:
                result["objective_score"] = float(numbers[0])
            if len(numbers) >= 2:
                result["potential_score"] = float(numbers[1])
            
            # Пробуем извлечь резюме
            summary_match = re.search(r'"summary":\s*"([^"]+)"', raw_response)
            if summary_match:
                result["summary"] = summary_match.group(1)
        
        # Определяем категорию если не задана
        if not result["category"] and result["objective_score"] > 0:
            score = result["objective_score"]
            if score < 4.0:
                result["category"] = 'SH'
            elif score < 5.0:
                result["category"] = 'LTN'
            elif score < 6.0:
                result["category"] = 'MTN'
            elif score < 7.0:
                result["category"] = 'HTN'
            elif score < 8.0:
                result["category"] = 'CL'
            else:
                result["category"] = 'Chad'
        
        logger.info(f"Parsed: objective={result['objective_score']}, potential={result['potential_score']}, metrics={len(result['metrics'])}")
        
        return result


# Синглтон клиент
vsellm_client = VseLLMClient()