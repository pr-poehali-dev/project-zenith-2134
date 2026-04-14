import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Icon from "@/components/ui/icon";

const API_EMPIRIC = "https://functions.poehali.dev/d0a75197-1874-4f92-aae1-e24b5c1832fb";
const API_TARGETED = "https://functions.poehali.dev/06b287c8-b19c-4b0c-a3dd-82fd2978a42e";

const STRATIFICATION_LABELS: Record<string, string> = {
  community_acquired: "Внебольничная инфекция",
  early_nosocomial: "Ранняя нозокомиальная инфекция",
  late_nosocomial_mrsa: "Поздняя нозокомиальная (риск МРЗС)",
  late_nosocomial_pseudomonas: "Поздняя нозокомиальная (риск P. aeruginosa)",
  low_risk: "Низкий риск",
};

interface EmpiricResult {
  type: string;
  stratification: string;
  first_line: string;
  second_line: string;
  third_line: string;
  allergy_alternative: string;
  renal_alternative: string;
  note: string;
  crcl: number | null;
  sofa_score: number | null;
  sofa_interpretation: string | null;
  lab_interpretation: string[];
  allergy_warnings: string[] | null;
}

interface TargetedRecommendation {
  drug: string;
  sensitivity: string;
  dose: string;
  renal_adjustment: string;
  note?: string;
}

interface TargetedResult {
  type: string;
  pathogen: string;
  risk_group: string;
  recommendations: TargetedRecommendation[];
  allergy_warnings: string[] | null;
}

interface EmpiricForm {
  localization: string;
  hospital_days: number;
  risk_factors: string[];
  allergy: string;
  age: number;
  weight: number;
  serum_creatinine: number;
  sex: string;
  sofa_score: number;
  leukocytes: string;
  esr: string;
  pct: string;
}

interface TargetedForm {
  pathogen: string;
  allergy: string;
}

function EmpiricResultView({ data }: { data: EmpiricResult }) {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="ClipboardList" size={20} className="text-blue-700" />
        <h3 className="text-lg font-semibold text-neutral-900">Результаты</h3>
      </div>

      {data.allergy_warnings && data.allergy_warnings.length > 0 && (
        <Alert variant="destructive">
          <Icon name="AlertTriangle" size={16} />
          <AlertTitle>Аллергические предупреждения</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-1">
              {data.allergy_warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Стратификация</p>
              <p className="font-semibold text-neutral-900">
                {STRATIFICATION_LABELS[data.stratification] || data.stratification}
              </p>
            </div>
            {data.crcl !== null && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-600 mb-1">Клиренс креатинина</p>
                <p className="font-semibold text-neutral-900">{data.crcl} мл/мин</p>
              </div>
            )}
            {data.sofa_interpretation && (
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-amber-600 mb-1">SOFA ({data.sofa_score} баллов)</p>
                <p className="font-semibold text-neutral-900">{data.sofa_interpretation}</p>
              </div>
            )}
          </div>

          {data.lab_interpretation.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-700 mb-2">Лабораторные маркеры:</p>
              <div className="space-y-1">
                {data.lab_interpretation.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                    <Icon name="TestTube" size={14} className="mt-0.5 shrink-0 text-blue-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-blue-50/50">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-600">1-я линия</Badge>
              </div>
              <p className="text-neutral-900 font-medium">{data.first_line}</p>
            </div>
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">2-я линия</Badge>
              </div>
              <p className="text-neutral-800">{data.second_line}</p>
            </div>
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">3-я линия</Badge>
              </div>
              <p className="text-neutral-700">{data.third_line}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="border rounded-lg p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">При аллергии</p>
              <p className="text-sm text-neutral-800">{data.allergy_alternative}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Почечная коррекция</p>
              <p className="text-sm text-neutral-800">{data.renal_alternative}</p>
            </div>
          </div>

          {data.note && (
            <div className="mt-4 flex items-start gap-2 text-sm text-neutral-600 bg-amber-50 rounded-lg p-3">
              <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <span>{data.note}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TargetedResultView({ data }: { data: TargetedResult }) {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Crosshair" size={20} className="text-blue-700" />
        <h3 className="text-lg font-semibold text-neutral-900">Результаты</h3>
      </div>

      {data.allergy_warnings && data.allergy_warnings.length > 0 && (
        <Alert variant="destructive">
          <Icon name="AlertTriangle" size={16} />
          <AlertTitle>Аллергические предупреждения</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-1">
              {data.allergy_warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">{data.pathogen}</CardTitle>
            <Badge variant="secondary">
              {STRATIFICATION_LABELS[data.risk_group] || data.risk_group}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Препарат</TableHead>
                <TableHead>Чувствительность</TableHead>
                <TableHead>Дозировка</TableHead>
                <TableHead className="hidden md:table-cell">Почечная коррекция</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recommendations.map((rec, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{rec.drug}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        rec.sensitivity === "S"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {rec.sensitivity === "S" ? "Чувствителен" : "Промежуточный"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{rec.dose}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">{rec.renal_adjustment}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="md:hidden mt-4 space-y-3">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                  Почечная коррекция: {rec.drug}
                </p>
                <p className="text-sm text-neutral-800">{rec.renal_adjustment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SkatBot() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [localizations, setLocalizations] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [pathogens, setPathogens] = useState<string[]>([]);

  const [empiricForm, setEmpiricForm] = useState<EmpiricForm>({
    localization: "",
    hospital_days: 0,
    risk_factors: [],
    allergy: "",
    age: 60,
    weight: 70,
    serum_creatinine: 80,
    sex: "male",
    sofa_score: 0,
    leukocytes: "",
    esr: "",
    pct: "",
  });

  const [targetedForm, setTargetedForm] = useState<TargetedForm>({
    pathogen: "",
    allergy: "",
  });

  const [empiricResult, setEmpiricResult] = useState<EmpiricResult | null>(null);
  const [targetedResult, setTargetedResult] = useState<TargetedResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [empRes, targRes] = await Promise.all([
          fetch(API_EMPIRIC),
          fetch(API_TARGETED),
        ]);
        if (!empRes.ok || !targRes.ok) throw new Error("Failed to load reference data");
        const empData = await empRes.json();
        const targData = await targRes.json();
        setLocalizations(empData.localizations || []);
        setRiskFactors(empData.risk_factors || []);
        setPathogens(targData.pathogens || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error loading data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRiskFactorToggle = useCallback((factor: string, checked: boolean) => {
    setEmpiricForm((prev) => ({
      ...prev,
      risk_factors: checked
        ? [...prev.risk_factors, factor]
        : prev.risk_factors.filter((f) => f !== factor),
    }));
  }, []);

  const handleEmpiricSubmit = async () => {
    if (!empiricForm.localization) return;
    setSubmitting(true);
    setSubmitError(null);
    setEmpiricResult(null);
    try {
      const res = await fetch(API_EMPIRIC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empiricForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setEmpiricResult(data);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTargetedSubmit = async () => {
    if (!targetedForm.pathogen) return;
    setSubmitting(true);
    setSubmitError(null);
    setTargetedResult(null);
    try {
      const res = await fetch(API_TARGETED, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetedForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setTargetedResult(data);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Icon name="AlertCircle" size={16} />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="empiric" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="empiric" className="gap-2">
          <Icon name="Stethoscope" size={16} />
          <span className="hidden sm:inline">Эмпирическая терапия</span>
          <span className="sm:hidden">Эмпирическая</span>
        </TabsTrigger>
        <TabsTrigger value="targeted" className="gap-2">
          <Icon name="Crosshair" size={16} />
          <span className="hidden sm:inline">Таргетная терапия</span>
          <span className="sm:hidden">Таргетная</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="empiric">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="Stethoscope" size={20} className="text-blue-700" />
              Эмпирическая антибактериальная терапия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Локализация инфекции</Label>
                <Select
                  value={empiricForm.localization}
                  onValueChange={(v) => setEmpiricForm((p) => ({ ...p, localization: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите локализацию" />
                  </SelectTrigger>
                  <SelectContent>
                    {localizations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Дней госпитализации</Label>
                <Input
                  type="number"
                  min={0}
                  value={empiricForm.hospital_days}
                  onChange={(e) =>
                    setEmpiricForm((p) => ({ ...p, hospital_days: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Факторы риска</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {riskFactors.map((factor) => (
                  <div key={factor} className="flex items-start space-x-2">
                    <Checkbox
                      id={`rf-${factor}`}
                      checked={empiricForm.risk_factors.includes(factor)}
                      onCheckedChange={(checked) =>
                        handleRiskFactorToggle(factor, checked === true)
                      }
                    />
                    <label
                      htmlFor={`rf-${factor}`}
                      className="text-sm leading-tight cursor-pointer"
                    >
                      {factor}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Аллергия</Label>
              <Input
                placeholder="Пенициллины, цефалоспорины..."
                value={empiricForm.allergy}
                onChange={(e) => setEmpiricForm((p) => ({ ...p, allergy: e.target.value }))}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                <Icon name="User" size={16} />
                Данные пациента
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Возраст</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={empiricForm.age}
                    onChange={(e) =>
                      setEmpiricForm((p) => ({ ...p, age: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Вес, кг</Label>
                  <Input
                    type="number"
                    min={1}
                    value={empiricForm.weight}
                    onChange={(e) =>
                      setEmpiricForm((p) => ({ ...p, weight: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Креатинин, мкмоль/л</Label>
                  <Input
                    type="number"
                    min={1}
                    value={empiricForm.serum_creatinine}
                    onChange={(e) =>
                      setEmpiricForm((p) => ({
                        ...p,
                        serum_creatinine: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <Select
                    value={empiricForm.sex}
                    onValueChange={(v) => setEmpiricForm((p) => ({ ...p, sex: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Мужской</SelectItem>
                      <SelectItem value="female">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                <Icon name="Activity" size={16} />
                Клинические показатели
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>SOFA-балл</Label>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    value={empiricForm.sofa_score}
                    onChange={(e) =>
                      setEmpiricForm((p) => ({ ...p, sofa_score: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Лейкоциты</Label>
                  <Select
                    value={empiricForm.leukocytes}
                    onValueChange={(v) => setEmpiricForm((p) => ({ ...p, leukocytes: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<4.0">{"<4.0"}</SelectItem>
                      <SelectItem value="4.0-10.0">4.0-10.0</SelectItem>
                      <SelectItem value="10.0-15.0">10.0-15.0</SelectItem>
                      <SelectItem value=">15.0">{">15.0"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>СОЭ</Label>
                  <Select
                    value={empiricForm.esr}
                    onValueChange={(v) => setEmpiricForm((p) => ({ ...p, esr: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<10">{"<10"}</SelectItem>
                      <SelectItem value="10-30">10-30</SelectItem>
                      <SelectItem value="30-60">30-60</SelectItem>
                      <SelectItem value=">60">{">60"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Прокальцитонин</Label>
                  <Select
                    value={empiricForm.pct}
                    onValueChange={(v) => setEmpiricForm((p) => ({ ...p, pct: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<0.1">{"<0.1"}</SelectItem>
                      <SelectItem value="0.1-0.25">0.1-0.25</SelectItem>
                      <SelectItem value="0.25-0.5">0.25-0.5</SelectItem>
                      <SelectItem value=">0.5">{">0.5"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {submitError && (
              <Alert variant="destructive">
                <Icon name="AlertCircle" size={16} />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleEmpiricSubmit}
              disabled={!empiricForm.localization || submitting}
              className="w-full md:w-auto"
              size="lg"
            >
              {submitting ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Расчет...
                </>
              ) : (
                <>
                  <Icon name="Calculator" size={16} />
                  Получить рекомендации
                </>
              )}
            </Button>

            {empiricResult && <EmpiricResultView data={empiricResult} />}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="targeted">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="Crosshair" size={20} className="text-blue-700" />
              Таргетная антибактериальная терапия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Возбудитель</Label>
                <Select
                  value={targetedForm.pathogen}
                  onValueChange={(v) => setTargetedForm((p) => ({ ...p, pathogen: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите возбудитель" />
                  </SelectTrigger>
                  <SelectContent>
                    {pathogens.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Аллергия</Label>
                <Input
                  placeholder="Пенициллины, цефалоспорины..."
                  value={targetedForm.allergy}
                  onChange={(e) => setTargetedForm((p) => ({ ...p, allergy: e.target.value }))}
                />
              </div>
            </div>

            {submitError && (
              <Alert variant="destructive">
                <Icon name="AlertCircle" size={16} />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTargetedSubmit}
              disabled={!targetedForm.pathogen || submitting}
              className="w-full md:w-auto"
              size="lg"
            >
              {submitting ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Расчет...
                </>
              ) : (
                <>
                  <Icon name="Search" size={16} />
                  Получить рекомендации
                </>
              )}
            </Button>

            {targetedResult && <TargetedResultView data={targetedResult} />}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
