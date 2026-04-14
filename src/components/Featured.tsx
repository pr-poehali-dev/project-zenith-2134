const features = [
  {
    label: "Доказательная база",
    text: "Рекомендации основаны на актуальных протоколах СКАТ и данных локальной микробиологии",
  },
  {
    label: "Быстрый выбор",
    text: "Задайте возбудителя, локализацию и клинику — бот предложит оптимальный антибиотик за секунды",
  },
  {
    label: "Контроль резистентности",
    text: "Учёт профилей резистентности и эпидемиологических данных вашего стационара",
  },
];

export default function Featured() {
  return (
    <div id="features" className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-white">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <img
          src="/images/desk.png"
          alt="Medical workspace"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4 text-sm tracking-wide text-neutral-500">Почему СКАТ·БОТ</h3>
        <p className="text-2xl lg:text-4xl mb-10 text-neutral-900 leading-tight">
          Правильная антибактериальная терапия — с первого назначения. Без лишних поисков в протоколах.
        </p>
        <div className="flex flex-col gap-6 mb-10">
          {features.map((f) => (
            <div key={f.label} className="border-l-2 border-neutral-900 pl-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{f.label}</p>
              <p className="text-neutral-800 text-base leading-snug">{f.text}</p>
            </div>
          ))}
        </div>
        <button className="bg-neutral-900 text-white border border-neutral-900 px-6 py-3 text-sm transition-all duration-300 hover:bg-white hover:text-neutral-900 cursor-pointer w-fit uppercase tracking-wide">
          Попробовать бота
        </button>
      </div>
    </div>
  );
}