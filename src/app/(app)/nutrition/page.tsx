"use client";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  addFoodLibraryItem,
  addMealWithMacros,
  deleteFoodLibraryItem,
  deleteMeal,
  getDailyTargets,
  getFoodLibrary,
  getMealsWithMacrosForDate,
  getMealPrepBatches,
  saveMealPrepBatch,
  upsertDailyTargets,
} from "@/lib/supabase/queries/nutrition";
import type {
  AddFoodLibraryItemData,
  DailyTargets,
  FoodLibraryItem,
  MealWithMacros,
} from "@/lib/supabase/queries/nutrition";
import { useEffect, useRef, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { SelectChangeEvent } from "@mui/material/Select";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateTodayEntry } from "@/lib/supabase/queries/journal";
import { useRouter } from "next/navigation";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const CATEGORIES = ["All", "Protein", "Eggs", "Dairy", "Fruit", "Grain", "Bread", "Noodles", "Vegetable", "Sauce", "Snack", "Other"];

const formatDate = (date: Date): string => date.toLocaleDateString("en-CA");

const displayDate = (dateStr: string): string => {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface MealItem {
  description: string;
  weight_g: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  category: string;
}

const emptyMealItem = (): MealItem => ({
  description: "",
  weight_g: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  category: "",
});

interface BatchIngredient {
  name: string;
  weight_g: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const emptyIngredient = (): BatchIngredient => ({
  name: "",
  weight_g: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
});

const NutritionPage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [tab, setTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const [meals, setMeals] = useState<MealWithMacros[]>([]);
  const [targets, setTargets] = useState<DailyTargets>({
    id: "",
    user_id: "",
    calorie_target: 1600,
    protein_target: 120,
    carb_target: null,
    fat_target: null,
    updated_at: "",
  });
  const [loadingToday, setLoadingToday] = useState(true);

  const [library, setLibrary] = useState<FoodLibraryItem[]>([]);
  const [libSearch, setLibSearch] = useState("");
  const [libCategory, setLibCategory] = useState("All");
  const [loadingLib, setLoadingLib] = useState(false);

  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addMealTab, setAddMealTab] = useState(0);
  const [mealType, setMealType] = useState("breakfast");
  const [mealItems, setMealItems] = useState<MealItem[]>([emptyMealItem()]);
  const [selectedLibItem, setSelectedLibItem] = useState<FoodLibraryItem | null>(null);
  const [libServings, setLibServings] = useState("1");
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoEstimate, setPhotoEstimate] = useState<null | {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingMeal, setSavingMeal] = useState(false);

  const [targetsOpen, setTargetsOpen] = useState(false);
  const [targetForm, setTargetForm] = useState({ calorie_target: "1600", protein_target: "120" });

  const [quickAddMealType, setQuickAddMealType] = useState("breakfast");
  const [addLibOpen, setAddLibOpen] = useState(false);
  const [libForm, setLibForm] = useState<AddFoodLibraryItemData>({ name: "" });
  const [savingLib, setSavingLib] = useState(false);

  const [batchName, setBatchName] = useState("");
  const [batchIngredients, setBatchIngredients] = useState<BatchIngredient[]>([emptyIngredient()]);
  const [batchCookedWeight, setBatchCookedWeight] = useState("");
  const [batchServings, setBatchServings] = useState("");
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    weight_g: number;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoadingToday(true);
      const [mealsData, targetsData] = await Promise.all([
        getMealsWithMacrosForDate(userId, selectedDate),
        getDailyTargets(userId),
      ]);
      setMeals(mealsData);
      setTargets(targetsData);
      setLoadingToday(false);
    };
    load();
  }, [userId, selectedDate]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoadingLib(true);
      const data = await getFoodLibrary(userId);
      setLibrary(data);
      setLoadingLib(false);
    };
    load();
  }, [userId]);

  const totalCalories = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein ?? 0), 0);
  const caloriesRemaining = targets.calorie_target - totalCalories;

  const mealsByType = MEAL_TYPES.reduce<Record<string, MealWithMacros[]>>((acc, t) => {
    acc[t] = meals.filter((m) => m.meal_type === t);
    return acc;
  }, {});

  const handleDateOffset = (offset: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    setSelectedDate(formatDate(d));
  };

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveMeal = async () => {
    if (!userId) return;
    setSavingMeal(true);

    const entry = await getOrCreateTodayEntry(userId);
    if (!entry || selectedDate !== formatDate(new Date())) {
      setSavingMeal(false);
      return;
    }

    if (addMealTab === 0) {
      const validItems = mealItems.filter((i) => i.description.trim());
      for (const item of validItems) {
        const cal = item.calories ? parseInt(item.calories) : null;
        const pro = item.protein ? parseFloat(item.protein) : null;
        const carb = item.carbs ? parseFloat(item.carbs) : null;
        const fat = item.fat ? parseFloat(item.fat) : null;
        const wt = item.weight_g ? parseFloat(item.weight_g) : null;

        const saved = await addMealWithMacros(entry.id, {
          meal_type: mealType,
          description: item.description.trim(),
          calories: cal,
          protein: pro,
          carbs: carb,
          fat: fat,
          weight_g: wt,
        });
        if (saved) setMeals((prev) => [...prev, saved]);

        const libItem = await addFoodLibraryItem(userId, {
          name: item.description.trim(),
          category: item.category || null,
          serving_weight_g: wt,
          calories_per_serving: cal,
          protein_per_serving: pro,
          carbs_per_serving: carb,
          fat_per_serving: fat,
          ...(wt && wt > 0
            ? {
                calories_per_100g: cal != null ? Math.round((cal / wt) * 100) : null,
                protein_per_100g: pro != null ? Math.round((pro / wt) * 1000) / 10 : null,
                carbs_per_100g: carb != null ? Math.round((carb / wt) * 1000) / 10 : null,
                fat_per_100g: fat != null ? Math.round((fat / wt) * 1000) / 10 : null,
              }
            : {}),
        });
        if (libItem) setLibrary((prev) => [...prev, libItem]);
      }
    } else if (addMealTab === 1 && selectedLibItem) {
      const mult = parseFloat(libServings) || 1;
      const saved = await addMealWithMacros(entry.id, {
        meal_type: mealType,
        description: selectedLibItem.name,
        calories: selectedLibItem.calories_per_serving
          ? Math.round(selectedLibItem.calories_per_serving * mult)
          : null,
        protein: selectedLibItem.protein_per_serving
          ? selectedLibItem.protein_per_serving * mult
          : null,
        carbs: selectedLibItem.carbs_per_serving
          ? selectedLibItem.carbs_per_serving * mult
          : null,
        fat: selectedLibItem.fat_per_serving ? selectedLibItem.fat_per_serving * mult : null,
        weight_g: selectedLibItem.serving_weight_g
          ? selectedLibItem.serving_weight_g * mult
          : null,
        food_library_item_id: selectedLibItem.id,
      });
      if (saved) setMeals((prev) => [...prev, saved]);
    } else if (addMealTab === 2 && photoEstimate) {
      const saved = await addMealWithMacros(entry.id, {
        meal_type: mealType,
        description: photoEstimate.description,
        calories: photoEstimate.calories,
        protein: photoEstimate.protein,
        carbs: photoEstimate.carbs,
        fat: photoEstimate.fat,
      });
      if (saved) setMeals((prev) => [...prev, saved]);
    }

    setAddMealOpen(false);
    setMealItems([emptyMealItem()]);
    setPhotoEstimate(null);
    setSelectedLibItem(null);
    setLibServings("1");
    setSavingMeal(false);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoAnalyzing(true);
    setPhotoEstimate(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch("/api/meals/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, type: "meal" }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          description: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
        setPhotoEstimate(data);
      }
      setPhotoAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTargets = async () => {
    if (!userId) return;
    const updated = await upsertDailyTargets(userId, {
      calorie_target: parseInt(targetForm.calorie_target) || 1600,
      protein_target: parseInt(targetForm.protein_target) || 120,
    });
    if (updated) setTargets(updated);
    setTargetsOpen(false);
  };

  const handleAddLibItem = async () => {
    if (!userId || !libForm.name) return;
    setSavingLib(true);
    const item = await addFoodLibraryItem(userId, libForm);
    if (item) setLibrary((prev) => [...prev, item]);
    setAddLibOpen(false);
    setLibForm({ name: "" });
    setSavingLib(false);
  };

  const handleDeleteLibItem = async (id: string) => {
    await deleteFoodLibraryItem(id);
    setLibrary((prev) => prev.filter((i) => i.id !== id));
  };

  const handleQuickAddToToday = async (item: FoodLibraryItem) => {
    if (!userId) return;
    const entry = await getOrCreateTodayEntry(userId);
    if (!entry) return;

    const saved = await addMealWithMacros(entry.id, {
      meal_type: quickAddMealType,
      description: item.name,
      calories: item.calories_per_serving ?? null,
      protein: item.protein_per_serving ?? null,
      carbs: item.carbs_per_serving ?? null,
      fat: item.fat_per_serving ?? null,
      weight_g: item.serving_weight_g ?? null,
      food_library_item_id: item.id,
    });

    if (saved && selectedDate === formatDate(new Date())) {
      setMeals((prev) => [...prev, saved]);
    }
  };

  const calcBatchResult = () => {
    const totalCal = batchIngredients.reduce((s, i) => s + (parseFloat(i.calories) || 0), 0);
    const totalPro = batchIngredients.reduce((s, i) => s + (parseFloat(i.protein) || 0), 0);
    const totalCar = batchIngredients.reduce((s, i) => s + (parseFloat(i.carbs) || 0), 0);
    const totalFat = batchIngredients.reduce((s, i) => s + (parseFloat(i.fat) || 0), 0);
    const servCount = parseInt(batchServings) || 1;
    const cookWeight = parseFloat(batchCookedWeight) || 0;

    setBatchResult({
      calories: Math.round(totalCal / servCount),
      protein: Math.round((totalPro / servCount) * 10) / 10,
      carbs: Math.round((totalCar / servCount) * 10) / 10,
      fat: Math.round((totalFat / servCount) * 10) / 10,
      weight_g: Math.round((cookWeight / servCount) * 10) / 10,
    });
  };

  const handleSaveBatchToLibrary = async () => {
    if (!userId || !batchResult || !batchName) return;
    setBatchSaving(true);

    const totalCal = batchIngredients.reduce((s, i) => s + (parseFloat(i.calories) || 0), 0);
    const totalPro = batchIngredients.reduce((s, i) => s + (parseFloat(i.protein) || 0), 0);
    const totalCar = batchIngredients.reduce((s, i) => s + (parseFloat(i.carbs) || 0), 0);
    const totalFat = batchIngredients.reduce((s, i) => s + (parseFloat(i.fat) || 0), 0);

    await saveMealPrepBatch(userId, {
      name: batchName,
      total_calories: totalCal,
      total_protein: totalPro,
      total_carbs: totalCar,
      total_fat: totalFat,
      total_weight_g: parseFloat(batchCookedWeight) || null,
      servings: parseInt(batchServings) || null,
      calories_per_serving: batchResult.calories,
      protein_per_serving: batchResult.protein,
      carbs_per_serving: batchResult.carbs,
      fat_per_serving: batchResult.fat,
    });

    await addFoodLibraryItem(userId, {
      name: batchName,
      serving_weight_g: batchResult.weight_g,
      calories_per_serving: batchResult.calories,
      protein_per_serving: batchResult.protein,
      carbs_per_serving: batchResult.carbs,
      fat_per_serving: batchResult.fat,
      is_meal_prep: true,
    });

    setBatchSaving(false);
    setBatchName("");
    setBatchIngredients([emptyIngredient()]);
    setBatchCookedWeight("");
    setBatchServings("");
    setBatchResult(null);
  };

  const filteredLibrary = library.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(libSearch.toLowerCase());
    const matchCat =
      libCategory === "All" ||
      (item.category?.toLowerCase() === libCategory.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <Box sx={{ pb: 12 }}>
      <Box sx={{ px: 2, pt: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>
          Nutrition
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{ px: 2, mt: 1 }}
        variant="fullWidth"
      >
        <Tab label="Today" />
        <Tab label="Library" />
        <Tab label="Batch" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 2 }}>
            <IconButton size="small" onClick={() => handleDateOffset(-1)}>
              <ArrowBackIosNewRoundedIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" fontWeight={600}>
              {displayDate(selectedDate)}
            </Typography>
            <IconButton size="small" onClick={() => handleDateOffset(1)}>
              <ArrowForwardIosRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          {loadingToday ? (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h3" fontWeight={700} lineHeight={1}>
                  {Math.abs(caloriesRemaining)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {caloriesRemaining >= 0 ? "kcal remaining" : "kcal over target"}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Calories
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalCalories} / {targets.calorie_target}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((totalCalories / targets.calorie_target) * 100, 100)}
                  sx={{ borderRadius: 2, height: 8 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Protein
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(totalProtein)}g / {targets.protein_target}g
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((totalProtein / targets.protein_target) * 100, 100)}
                  color="secondary"
                  sx={{ borderRadius: 2, height: 8 }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setTargetForm({
                      calorie_target: String(targets.calorie_target),
                      protein_target: String(targets.protein_target),
                    });
                    setTargetsOpen(true);
                  }}
                >
                  Edit targets
                </Button>
              </Box>

              {MEAL_TYPES.map((type) => {
                const group = mealsByType[type];
                if (group.length === 0) return null;
                return (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {type}
                    </Typography>
                    {group.map((meal) => (
                      <Box
                        key={meal.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          py: 1,
                          borderBottom: "0.5px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {meal.description}
                            {meal.weight_g ? (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                {meal.weight_g}g
                              </Typography>
                            ) : null}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {meal.calories ?? "–"} kcal
                            {meal.protein != null ? ` · P ${meal.protein}g` : ""}
                            {meal.carbs != null ? ` · C ${meal.carbs}g` : ""}
                            {meal.fat != null ? ` · F ${meal.fat}g` : ""}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleDeleteMeal(meal.id)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                );
              })}

              {meals.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", pt: 4 }}>
                  No meals logged yet
                </Typography>
              )}
            </>
          )}

          <Fab
            color="primary"
            sx={{ position: "fixed", bottom: 80, right: 20 }}
            onClick={() => setAddMealOpen(true)}
          >
            <AddRoundedIcon />
          </Fab>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
            Add to
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {MEAL_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant={quickAddMealType === t ? "filled" : "outlined"}
                onClick={() => setQuickAddMealType(t)}
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search foods…"
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
            sx={{ mb: 1.5 }}
          />

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                variant={libCategory === cat ? "filled" : "outlined"}
                onClick={() => setLibCategory(cat)}
              />
            ))}
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => setAddLibOpen(true)}
            sx={{ mb: 2 }}
          >
            Add new item
          </Button>

          {loadingLib ? (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : filteredLibrary.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", pt: 4 }}>
              No items yet
            </Typography>
          ) : (
            filteredLibrary.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 1.5,
                  borderBottom: "0.5px solid",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {item.name}
                  </Typography>
                  {item.brand && (
                    <Typography variant="caption" color="text.secondary">
                      {item.brand}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {item.calories_per_serving ?? "–"} kcal
                    {item.protein_per_serving != null ? ` · P ${item.protein_per_serving}g` : ""}
                    {item.serving_description ? ` · ${item.serving_description}` : ""}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => handleQuickAddToToday(item)}>
                  Add
                </Button>
                <IconButton size="small" onClick={() => handleDeleteLibItem(item.id)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Batch meal prep calculator
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Meal name"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Ingredients
          </Typography>

          {batchIngredients.map((ing, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                label="Name"
                value={ing.name}
                onChange={(e) => {
                  const next = [...batchIngredients];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setBatchIngredients(next);
                }}
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                label="g"
                type="number"
                value={ing.weight_g}
                onChange={(e) => {
                  const next = [...batchIngredients];
                  next[idx] = { ...next[idx], weight_g: e.target.value };
                  setBatchIngredients(next);
                }}
                sx={{ width: 64 }}
              />
              <TextField
                size="small"
                label="kcal"
                type="number"
                value={ing.calories}
                onChange={(e) => {
                  const next = [...batchIngredients];
                  next[idx] = { ...next[idx], calories: e.target.value };
                  setBatchIngredients(next);
                }}
                sx={{ width: 72 }}
              />
              <TextField
                size="small"
                label="P"
                type="number"
                value={ing.protein}
                onChange={(e) => {
                  const next = [...batchIngredients];
                  next[idx] = { ...next[idx], protein: e.target.value };
                  setBatchIngredients(next);
                }}
                sx={{ width: 60 }}
              />
              <TextField
                size="small"
                label="C"
                type="number"
                value={ing.carbs}
                onChange={(e) => {
                  const next = [...batchIngredients];
                  next[idx] = { ...next[idx], carbs: e.target.value };
                  setBatchIngredients(next);
                }}
                sx={{ width: 60 }}
              />
              <TextField
                size="small"
                label="F"
                type="number"
                value={ing.fat}
                onChange={(e) => {
                  const next = [...batchIngredients];
                  next[idx] = { ...next[idx], fat: e.target.value };
                  setBatchIngredients(next);
                }}
                sx={{ width: 60 }}
              />
              {batchIngredients.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => setBatchIngredients((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}

          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => setBatchIngredients((prev) => [...prev, emptyIngredient()])}
            sx={{ mb: 2 }}
          >
            Add ingredient
          </Button>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              size="small"
              label="Cooked weight (g)"
              type="number"
              value={batchCookedWeight}
              onChange={(e) => setBatchCookedWeight(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Servings"
              type="number"
              value={batchServings}
              onChange={(e) => setBatchServings(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          <Button variant="outlined" onClick={calcBatchResult} sx={{ mb: 2 }}>
            Calculate
          </Button>

          {batchResult && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "action.hover",
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Per serving
              </Typography>
              <Typography variant="body2">
                {batchResult.calories} kcal · P {batchResult.protein}g · C {batchResult.carbs}g · F {batchResult.fat}g
              </Typography>
              {batchResult.weight_g > 0 && (
                <Typography variant="caption" color="text.secondary">
                  ~{batchResult.weight_g}g per serving
                </Typography>
              )}

              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1.5, display: "block" }}
                disabled={!batchName || batchSaving}
                onClick={handleSaveBatchToLibrary}
              >
                {batchSaving ? "Saving…" : "Save to library"}
              </Button>
            </Box>
          )}
        </Box>
      )}

      <Dialog open={addMealOpen} onClose={() => setAddMealOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add meal</DialogTitle>
        <DialogContent>
          <Tabs
            value={addMealTab}
            onChange={(_, v: number) => setAddMealTab(v)}
            sx={{ mb: 2 }}
            variant="fullWidth"
          >
            <Tab label="Manual" />
            <Tab label="Library" />
            <Tab label="Photo" />
          </Tabs>

          {addMealTab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Select
                size="small"
                value={mealType}
                onChange={(e: SelectChangeEvent) => setMealType(e.target.value)}
                fullWidth
              >
                {MEAL_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                    {t}
                  </MenuItem>
                ))}
              </Select>

              {mealItems.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    pb: 1.5,
                    borderBottom: idx < mealItems.length - 1 ? "0.5px solid" : "none",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      placeholder="Item (e.g. 2 scrambled eggs)"
                      fullWidth
                      value={item.description}
                      onChange={(e) => {
                        const next = [...mealItems];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setMealItems(next);
                      }}
                      autoFocus={idx === 0}
                    />
                    {mealItems.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => setMealItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        size="small"
                        variant={item.category === cat ? "filled" : "outlined"}
                        onClick={() => {
                          const next = [...mealItems];
                          next[idx] = { ...next[idx], category: item.category === cat ? "" : cat };
                          setMealItems(next);
                        }}
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      label="kcal"
                      type="number"
                      value={item.calories}
                      onChange={(e) => {
                        const next = [...mealItems];
                        next[idx] = { ...next[idx], calories: e.target.value };
                        setMealItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="g"
                      type="number"
                      value={item.weight_g}
                      onChange={(e) => {
                        const next = [...mealItems];
                        next[idx] = { ...next[idx], weight_g: e.target.value };
                        setMealItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="P"
                      type="number"
                      value={item.protein}
                      onChange={(e) => {
                        const next = [...mealItems];
                        next[idx] = { ...next[idx], protein: e.target.value };
                        setMealItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="C"
                      type="number"
                      value={item.carbs}
                      onChange={(e) => {
                        const next = [...mealItems];
                        next[idx] = { ...next[idx], carbs: e.target.value };
                        setMealItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="F"
                      type="number"
                      value={item.fat}
                      onChange={(e) => {
                        const next = [...mealItems];
                        next[idx] = { ...next[idx], fat: e.target.value };
                        setMealItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              ))}

              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setMealItems((prev) => [...prev, emptyMealItem()])}
                sx={{ alignSelf: "flex-start" }}
              >
                Add item
              </Button>
            </Box>
          )}

          {addMealTab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Select
                size="small"
                value={mealType}
                onChange={(e: SelectChangeEvent) => setMealType(e.target.value)}
                fullWidth
              >
                {MEAL_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
              <Autocomplete
                size="small"
                options={library}
                getOptionLabel={(opt) => opt.name}
                value={selectedLibItem}
                onChange={(_, val) => {
                  setSelectedLibItem(val);
                  setLibServings("1");
                }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select food…" />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Box>
                      <Typography variant="body2">{opt.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {opt.calories_per_serving ?? "–"} kcal
                        {opt.serving_description ? ` · ${opt.serving_description}` : ""}
                      </Typography>
                    </Box>
                  </li>
                )}
                fullWidth
              />
              {selectedLibItem && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    label="Servings"
                    type="number"
                    value={libServings}
                    onChange={(e) => setLibServings(e.target.value)}
                    sx={{ width: 90 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    ={" "}
                    {selectedLibItem.calories_per_serving
                      ? Math.round(selectedLibItem.calories_per_serving * (parseFloat(libServings) || 1))
                      : "–"}{" "}
                    kcal
                    {selectedLibItem.protein_per_serving != null
                      ? ` · P ${Math.round(selectedLibItem.protein_per_serving * (parseFloat(libServings) || 1) * 10) / 10}g`
                      : ""}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {addMealTab === 2 && (
            <Box>
              <Select
                size="small"
                value={mealType}
                onChange={(e: SelectChangeEvent) => setMealType(e.target.value)}
                fullWidth
                sx={{ mb: 1.5 }}
              >
                {MEAL_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 2 }}
              >
                Take photo or choose image
              </Button>

              {photoAnalyzing && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing…
                  </Typography>
                </Box>
              )}

              {photoEstimate && (
                <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                    {photoEstimate.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {photoEstimate.calories} kcal · P {photoEstimate.protein}g · C{" "}
                    {photoEstimate.carbs}g · F {photoEstimate.fat}g
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Review and confirm before saving
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mt: 2.5, justifyContent: "flex-end" }}>
            <Button onClick={() => setAddMealOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={savingMeal}
              onClick={handleSaveMeal}
            >
              {savingMeal ? "Saving…" : "Save"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={targetsOpen} onClose={() => setTargetsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit targets</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
            <TextField
              size="small"
              label="Daily calories"
              type="number"
              fullWidth
              value={targetForm.calorie_target}
              onChange={(e) => setTargetForm((f) => ({ ...f, calorie_target: e.target.value }))}
            />
            <TextField
              size="small"
              label="Protein target (g)"
              type="number"
              fullWidth
              value={targetForm.protein_target}
              onChange={(e) => setTargetForm((f) => ({ ...f, protein_target: e.target.value }))}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2.5, justifyContent: "flex-end" }}>
            <Button onClick={() => setTargetsOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveTargets}>
              Save
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={addLibOpen} onClose={() => setAddLibOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add food item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
            <TextField
              size="small"
              label="Name *"
              fullWidth
              value={libForm.name}
              onChange={(e) => setLibForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              size="small"
              label="Brand"
              fullWidth
              value={libForm.brand ?? ""}
              onChange={(e) => setLibForm((f) => ({ ...f, brand: e.target.value }))}
            />
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={libForm.category ?? ""}
              onChange={(e: SelectChangeEvent) =>
                setLibForm((f) => ({ ...f, category: e.target.value || null }))
              }
            >
              <MenuItem value="">
                <em>Category</em>
              </MenuItem>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
            <TextField
              size="small"
              label="Serving description"
              fullWidth
              value={libForm.serving_description ?? ""}
              onChange={(e) => setLibForm((f) => ({ ...f, serving_description: e.target.value }))}
            />
            <TextField
              size="small"
              label="Serving weight (g)"
              type="number"
              fullWidth
              value={libForm.serving_weight_g ?? ""}
              onChange={(e) =>
                setLibForm((f) => ({
                  ...f,
                  serving_weight_g: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Calories"
                type="number"
                value={libForm.calories_per_serving ?? ""}
                onChange={(e) =>
                  setLibForm((f) => ({
                    ...f,
                    calories_per_serving: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Protein (g)"
                type="number"
                value={libForm.protein_per_serving ?? ""}
                onChange={(e) =>
                  setLibForm((f) => ({
                    ...f,
                    protein_per_serving: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Carbs (g)"
                type="number"
                value={libForm.carbs_per_serving ?? ""}
                onChange={(e) =>
                  setLibForm((f) => ({
                    ...f,
                    carbs_per_serving: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Fat (g)"
                type="number"
                value={libForm.fat_per_serving ?? ""}
                onChange={(e) =>
                  setLibForm((f) => ({
                    ...f,
                    fat_per_serving: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2.5, justifyContent: "flex-end" }}>
            <Button onClick={() => setAddLibOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!libForm.name || savingLib}
              onClick={handleAddLibItem}
            >
              {savingLib ? "Saving…" : "Save"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default NutritionPage;
