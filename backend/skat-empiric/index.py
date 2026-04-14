import json
import os

# ========== STATIC DATA ==========

RISK_FACTORS = [
    {"name": "ИВЛ > 5 дней", "category": "pseudomonas", "weight": 2},
    {"name": "Предшествующие антибиотики (цефалоспорины/фторхинолоны)", "category": "mrsa", "weight": 2},
    {"name": "Колонизация/инфекция МРЗС в анамнезе", "category": "mrsa", "weight": 3},
    {"name": "Нейтропения (<500)", "category": "pseudomonas", "weight": 2},
    {"name": "Катетер центральной вены >7 дней", "category": "mrsa", "weight": 1},
    {"name": "Послеоперационная рана (абдоминальная)", "category": "anaerobes", "weight": 2},
    {"name": "Длительная госпитализация (>14 дней)", "category": "pseudomonas", "weight": 2},
]

RISK_FACTOR_NAMES = [f["name"] for f in RISK_FACTORS]

LOCALIZATIONS = [
    "Пневмония",
    "Интраабдоминальная инфекция",
    "ИМВП",
    "Сепсис",
]

# (localization, stratification, first_line, second_line, third_line, allergy_alternative, renal_alternative, note)
PROTOCOLS = [
    ("Пневмония", "community_acquired", "Амоксициллин/клавуланат", "Цефтриаксон + Азитромицин", "Левофлоксацин", "Макролиды (при аллергии на пенициллины)", "Цефтриаксон 1 г/сут при CrCl<30", "Учитывать аллергию"),
    ("Пневмония", "early_nosocomial", "Цефтриаксон", "Левофлоксацин", "Моксифлоксацин", "Азитромицин + цефтриаксон", "Цефтриаксон 1 г/сут при CrCl<30", "Длительность госпитализации <5 дней"),
    ("Пневмония", "late_nosocomial_mrsa", "Линезолид + Цефепим", "Ванкомицин + Пиперациллин/тазобактам", "Тигециклин + Цефепим", "Линезолид (при аллергии на ванкомицин)", "Коррекция цефепима при CrCl<60", "Покрытие МРЗС и грам-отрицательных"),
    ("Пневмония", "late_nosocomial_pseudomonas", "Пиперациллин/тазобактам", "Меропенем + Амикацин", "Цефепим + Амикацин", "Колистин + меропенем", "Коррекция всех препаратов по CrCl", "Риск синегнойной инфекции"),
    ("Интраабдоминальная инфекция", "community_acquired", "Цефтриаксон + Метронидазол", "Левофлоксацин + Метронидазол", "Моксифлоксацин моно", "Метронидазол + амоксициллин/клавуланат", "Метронидазол без коррекции", "Альтернатива: тигециклин"),
    ("Интраабдоминальная инфекция", "late_nosocomial_mrsa", "Ванкомицин + Пиперациллин/тазобактам", "Тигециклин", "Линезолид + Меропенем", "Даптомицин + метронидазол", "Коррекция ванкомицина и пиперациллина", "Тяжелое течение + риск МРЗС"),
    ("Интраабдоминальная инфекция", "late_nosocomial_pseudomonas", "Меропенем", "Пиперациллин/тазобактам + Амикацин", "Цефепим + Метронидазол", "Колистин + меропенем", "Коррекция по CrCl", "При перфорации + анаэробы покрыты"),
    ("ИМВП", "community_acquired", "Цефтриаксон", "Левофлоксацин", "Фосфомицин (однократно)", "Нитрофурантоин (при цистите)", "Цефтриаксон 1 г/сут при CrCl<30", "При цистите возможно фосфомицин однократно"),
    ("ИМВП", "late_nosocomial_mrsa", "Ванкомицин (при катетере)", "Линезолид", "Даптомицин", "Рифампицин + котримоксазол", "Ванкомицин по CrCl", "Энтерококковая инфекция возможна"),
    ("ИМВП", "late_nosocomial_pseudomonas", "Пиперациллин/тазобактам", "Цефепим", "Меропенем", "Амикацин", "Коррекция всех препаратов", "Часто P. aeruginosa у катетерных"),
    ("Сепсис", "early_nosocomial", "Пиперациллин/тазобактам", "Цефтриаксон + Метронидазол", "Меропенем", "Ванкомицин + цефтриаксон", "Коррекция по CrCl", "Деэскалация через 48ч"),
    ("Сепсис", "late_nosocomial_mrsa", "Ванкомицин + Пиперациллин/тазобактам", "Меропенем + Линезолид", "Цефепим + Линезолид + Метронидазол", "Даптомицин + меропенем", "Коррекция всех", "Эмпирически широкий спектр"),
    ("Сепсис", "late_nosocomial_pseudomonas", "Меропенем + Амикацин", "Цефепим + Амикацин", "Пиперациллин/тазобактам + тобрамицин", "Колистин + меропенем", "Коррекция всех", "При септическом шоке + коломицин"),
]

DRUGS = [
    {"name": "Цефтриаксон", "dose": "1-2 г в/в 1 р/сут", "renal_adjustment": "Клир. креат. >30: без изменений; <30: 1 г/сут", "category": "C"},
    {"name": "Меропенем", "dose": "1 г в/в 3 р/сут (до 2 г 3 р/сут)", "renal_adjustment": "Клир. креат. 26-50: 1 г 2 р/сут; 10-25: 0.5 г 2 р/сут; <10: 0.5 г 1 р/сут", "category": "B"},
    {"name": "Пиперациллин/тазобактам", "dose": "4.5 г в/в 3-4 р/сут", "renal_adjustment": "Клир. креат. 20-40: 4.5 г 2 р/сут; <20: 4.5 г 1 р/сут", "category": "B"},
    {"name": "Ванкомицин", "dose": "15-20 мг/кг каждые 8-12ч, мониторинг", "renal_adjustment": "Коррекция по клиренсу креатинина (интервал)", "category": "C"},
    {"name": "Линезолид", "dose": "600 мг в/в или внутрь 2 р/сут", "renal_adjustment": "Коррекции не требуется", "category": "C"},
    {"name": "Левофлоксацин", "dose": "500 мг 1-2 р/сут", "renal_adjustment": "Клир. креат. 20-49: 250 мг 1-2 р/сут; <20: 250 мг 1 р/сут", "category": "C"},
    {"name": "Амикацин", "dose": "15-20 мг/кг 1 р/сут", "renal_adjustment": "Удлинение интервала при клир. <60", "category": "D"},
    {"name": "Цефепим", "dose": "1-2 г в/в 2-3 р/сут", "renal_adjustment": "Клир. креат. 30-60: 1-2 г 2 р/сут; 11-29: 1-2 г 1 р/сут; <10: 0.5-1 г 1 р/сут", "category": "B"},
    {"name": "Метронидазол", "dose": "500 мг в/в 3 р/сут", "renal_adjustment": "Коррекции не требуется", "category": "B"},
]


# ========== HELPER FUNCTIONS ==========

def calculate_crcl(age, weight, serum_creatinine, sex):
    """Cockcroft-Gault formula for creatinine clearance."""
    if serum_creatinine > 20:
        scr_mgdl = serum_creatinine / 88.4
    else:
        scr_mgdl = serum_creatinine
    numerator = (140 - age) * weight
    denominator = 72 * scr_mgdl
    crcl = numerator / denominator
    if sex == "female":
        crcl *= 0.85
    return max(crcl, 5)


def interpret_sofa(sofa_score):
    """Interpret SOFA score into risk category."""
    if sofa_score < 2:
        return "Низкий риск смертности (<10%)"
    elif sofa_score < 6:
        return "Умеренный риск (10-20%)"
    elif sofa_score < 12:
        return "Высокий риск (30-40%)"
    else:
        return "Очень высокий риск (>50%)"


def interpret_lab_markers(leukocytes, esr, pct):
    """Interpret laboratory markers."""
    result = []
    if leukocytes == "<4.0":
        result.append("Лейкопения — возможна вирусная инфекция, сепсис.")
    elif leukocytes == "4.0-10.0":
        result.append("Лейкоциты в норме — не исключает бактериальную инфекцию.")
    elif leukocytes == "10.0-15.0":
        result.append("Умеренный лейкоцитоз — характерен для бактериальной инфекции.")
    elif leukocytes == ">15.0":
        result.append("Выраженный лейкоцитоз — высокая вероятность бактериальной инфекции.")

    if esr == "<10":
        result.append("СОЭ в норме — маловероятно активное воспаление.")
    elif esr == "10-30":
        result.append("СОЭ умеренно повышена.")
    elif esr == "30-60":
        result.append("СОЭ значительно повышена — характерно для бактериальных инфекций.")
    elif esr == ">60":
        result.append("СОЭ резко повышена — тяжелая инфекция, сепсис.")

    if pct == "<0.1":
        result.append("Прокальцитонин <0.1 — бактериальная инфекция маловероятна.")
    elif pct == "0.1-0.25":
        result.append("Прокальцитонин 0.1-0.25 — локальная инфекция возможна.")
    elif pct == "0.25-0.5":
        result.append("Прокальцитонин 0.25-0.5 — высокая вероятность бактериальной инфекции.")
    elif pct == ">0.5":
        result.append("Прокальцитонин >0.5 — бактериальная инфекция очень вероятна.")

    return result


def determine_stratification(localization, hospital_days, risk_factors_list):
    """Determine risk stratification based on localization, hospital days, and risk factors."""
    if hospital_days < 2:
        return "community_acquired"
    elif hospital_days <= 7:
        return "early_nosocomial"
    else:
        mrsa_factors = [
            "Предшествующие антибиотики (цефалоспорины/фторхинолоны)",
            "Колонизация/инфекция МРЗС в анамнезе",
            "Катетер центральной вены >7 дней",
        ]
        pseudomonas_factors = [
            "ИВЛ > 5 дней",
            "Нейтропения (<500)",
            "Длительная госпитализация (>14 дней)",
        ]
        has_mrsa = any(f in mrsa_factors for f in risk_factors_list)
        has_pseudomonas = any(f in pseudomonas_factors for f in risk_factors_list)
        if has_mrsa:
            return "late_nosocomial_mrsa"
        elif has_pseudomonas:
            return "late_nosocomial_pseudomonas"
        else:
            return "early_nosocomial"


def get_empiric_recommendation(localization, stratification):
    """Look up empiric protocol by localization and stratification."""
    for proto in PROTOCOLS:
        if proto[0] == localization and proto[1] == stratification:
            return {
                "first_line": proto[2],
                "second_line": proto[3],
                "third_line": proto[4],
                "allergy_alternative": proto[5],
                "renal_alternative": proto[6],
                "note": proto[7],
            }
    return None


def check_allergy_alert(drugs_list, allergy_history):
    """Check for cross-allergy warnings."""
    if not allergy_history or allergy_history.lower() == "нет":
        return None
    allergy_lower = allergy_history.lower()
    warnings = []
    for drug in drugs_list:
        if "пенициллин" in allergy_lower and drug.lower() in [
            "амоксициллин/клавуланат",
            "пиперациллин/тазобактам",
        ]:
            warnings.append(f"Перекрёстная аллергия на {drug} (пенициллины)")
        if "цефалоспорин" in allergy_lower and drug.lower() in [
            "цефтриаксон",
            "цефепим",
        ]:
            warnings.append(f"Перекрёстная аллергия на {drug} (цефалоспорины)")
    return warnings if warnings else None


def _extract_drug_names_from_recommendation(rec):
    """Extract individual drug names from a recommendation dict for allergy checking."""
    drug_names = set()
    for key in ["first_line", "second_line", "third_line", "allergy_alternative"]:
        value = rec.get(key, "")
        if not value:
            continue
        # Split by " + " and strip common patterns like parenthetical notes
        parts = value.split(" + ")
        for part in parts:
            # Clean up: remove parenthetical suffixes like "(при аллергии ...)"
            clean = part.strip()
            # Try to match against known drug names
            for drug in DRUGS:
                if drug["name"].lower() in clean.lower():
                    drug_names.add(drug["name"])
    return list(drug_names)


# ========== RESPONSE HELPERS ==========

def make_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


# ========== MAIN HANDLER ==========

def handler(event: dict, context) -> dict:
    method = event.get("httpMethod", event.get("method", "GET")).upper()

    # CORS preflight
    if method == "OPTIONS":
        return make_response(200, {"status": "ok"})

    # GET: return available risk factors and localizations
    if method == "GET":
        return make_response(200, {
            "risk_factors": RISK_FACTOR_NAMES,
            "localizations": LOCALIZATIONS,
            "drugs": DRUGS,
        })

    # POST: compute empiric recommendation
    if method == "POST":
        try:
            body = json.loads(event.get("body", "{}"))
        except (json.JSONDecodeError, TypeError):
            return make_response(400, {"error": "Invalid JSON body"})

        localization = body.get("localization")
        hospital_days = body.get("hospital_days", 0)
        risk_factors_input = body.get("risk_factors", [])
        allergy = body.get("allergy", "")
        age = body.get("age")
        weight = body.get("weight")
        serum_creatinine = body.get("serum_creatinine")
        sex = body.get("sex", "male")
        sofa_score = body.get("sofa_score", 0)
        leukocytes = body.get("leukocytes", "")
        esr = body.get("esr", "")
        pct = body.get("pct", "")

        # Validate required fields
        if not localization:
            return make_response(400, {"error": "localization is required"})
        if localization not in LOCALIZATIONS:
            return make_response(400, {"error": f"Unknown localization: {localization}. Available: {LOCALIZATIONS}"})

        # Calculate CrCl if data provided
        crcl = None
        if age is not None and weight is not None and serum_creatinine is not None:
            try:
                crcl = round(calculate_crcl(
                    float(age), float(weight), float(serum_creatinine), sex
                ), 1)
            except (ValueError, ZeroDivisionError):
                crcl = None

        # Interpret SOFA
        sofa_interpretation = interpret_sofa(int(sofa_score)) if sofa_score is not None else None

        # Interpret lab markers
        lab_interpretation = interpret_lab_markers(leukocytes, esr, pct)

        # Determine stratification
        stratification = determine_stratification(localization, int(hospital_days), risk_factors_input)

        # Get recommendation
        rec = get_empiric_recommendation(localization, stratification)

        if rec is None:
            return make_response(404, {
                "error": f"No protocol found for localization='{localization}', stratification='{stratification}'",
                "stratification": stratification,
            })

        # Check allergy
        drug_names = _extract_drug_names_from_recommendation(rec)
        allergy_warnings = check_allergy_alert(drug_names, allergy)

        result = {
            "type": "empiric",
            "stratification": stratification,
            "first_line": rec["first_line"],
            "second_line": rec["second_line"],
            "third_line": rec["third_line"],
            "allergy_alternative": rec["allergy_alternative"],
            "renal_alternative": rec["renal_alternative"],
            "note": rec["note"],
            "crcl": crcl,
            "sofa_score": int(sofa_score) if sofa_score is not None else None,
            "sofa_interpretation": sofa_interpretation,
            "lab_interpretation": lab_interpretation,
            "allergy_warnings": allergy_warnings,
        }

        return make_response(200, result)

    return make_response(405, {"error": f"Method {method} not allowed"})
