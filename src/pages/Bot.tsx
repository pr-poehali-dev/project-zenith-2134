import { Link } from "react-router-dom";
import SkatBot from "@/components/SkatBot";
import Icon from "@/components/ui/icon";

export default function Bot() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <Icon name="ArrowLeft" size={16} />
            <span className="hidden sm:inline">Назад на главную</span>
            <span className="sm:hidden">Назад</span>
          </Link>
          <div className="flex items-center gap-2">
            <Icon name="Pill" size={18} className="text-blue-700" />
            <span className="font-bold text-sm uppercase tracking-wide text-neutral-900">
              СКАТ·БОТ
            </span>
          </div>
          <div className="w-[100px]" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            Помощник антибактериальной терапии
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base">
            Выберите тип терапии и заполните параметры для получения рекомендаций на основе протоколов СКАТ
          </p>
        </div>
        <SkatBot />
      </main>
    </div>
  );
}
