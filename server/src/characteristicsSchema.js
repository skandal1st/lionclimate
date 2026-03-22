/** Mirrors admin/config.php getFixedCharacteristicsSchema */
export const CHARACTERISTICS_SCHEMA = [
  { key: 'seriya', label: 'Серия', placeholder: 'напр. CT-65Ixx' },
  { key: 'rezhim_raboty', label: 'Режим работы', placeholder: 'тепло/холод, только холод' },
  { key: 'invertor', label: 'Инвертор', placeholder: 'да / нет' },
  { key: 'ploshad_m2', label: 'Площадь, м²', placeholder: '28' },
  { key: 'ionizator', label: 'Ионизатор', placeholder: 'да / нет' },
  { key: 'ohlazhdenie_kvt', label: 'Охлаждение, кВт', placeholder: '2.84' },
  { key: 'obogrev_kvt', label: 'Обогрев, кВт', placeholder: '2.92' },
  { key: 'btu', label: 'BTU', placeholder: '9000, 10000, 12000...' },
  { key: 'nominalnaya_moschnost_kvt', label: 'Номинальная мощность, кВт', placeholder: '0.80' },
  { key: 'uroven_shuma_db', label: 'Уровень шума, дБ(А)', placeholder: '22' },
  { key: 'garantiya_mes', label: 'Гарантия, мес', placeholder: '36' },
  { key: 'strana', label: 'Страна изготовитель', placeholder: 'Китай' },
  { key: 'elektropitanie_v', label: 'Электропитание, В', placeholder: '220-240' },
  { key: 'diametr_trub', label: 'Диаметр труб хладагента', placeholder: '6,35/9,52' },
  { key: 'dlina_trassy_m', label: 'Длина трассы/перепад высот, м', placeholder: '20/10' },
  { key: 'hladagent', label: 'Хладагент', placeholder: 'R32, R410A' },
  { key: 'gabarity_vnutr', label: 'Габариты внутр. блока (Ш×В×Г), мм', placeholder: '761×295×200' },
  { key: 'gabarity_naruzh', label: 'Габариты наруж. блока (Ш×В×Г), мм', placeholder: '705×530×279' },
  { key: 'ves_vnutr_kg', label: 'Вес внутреннего блока, кг', placeholder: '7.5' },
  { key: 'ves_naruzh_kg', label: 'Вес наружного блока, кг', placeholder: '22.5' },
  { key: 'wifi', label: 'Wi‑Fi модуль', placeholder: 'да / нет / опция' },
  { key: 'diapazon_ohlazhdenie', label: 'Диапазон рабочих темп. охл., °С', placeholder: '+16…+49' },
  { key: 'diapazon_obogrev', label: 'Диапазон рабочих темп. нагрев., °С', placeholder: '-15…+30' },
  { key: 'rashod_vozduha', label: 'Расход воздуха, м³/час', placeholder: '500' },
];

export function buildCharacteristicsFromObject(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const result = [];
  for (const item of CHARACTERISTICS_SCHEMA) {
    const val = String(obj[item.key] ?? '').trim();
    if (val !== '') {
      result.push({ name: item.label, key: item.key, value: val });
    }
  }
  return result;
}
