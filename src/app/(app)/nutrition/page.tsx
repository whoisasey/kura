"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import type {
  AddFoodLibraryItemData,
  DailyTargets,
  FoodLibraryItem,
  MealWithMacros,
} from "@/lib/supabase/queries/nutrition";
import {
  addFoodLibraryItem,
  addMealWithMacros,
  deleteFoodLibraryItem,
  deleteMeal,
  getDailyTargets,
  getFoodLibrary,
  getMealsWithMacrosForDate,
  updateFoodLibraryItem,
  upsertDailyTargets,
} from "@/lib/supabase/queries/nutrition";
import { useEffect, useRef, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { SelectChangeEvent } from "@mui/material/Select";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateEntryForDate } from "@/lib/supabase/queries/journal";
import { useRouter } from "next/navigation";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const CATEGORIES = [
  "All",
  "Protein",
  "Dairy",
  "Fruit",
  "Grain",
  "Bread",
  "Noodles",
  "Vegetable",
  "Sauce",
  "Snack",
  "Soup",
  "Other",
];

const formatDate = (date: Date): string => date.toLocaleDateString("en-CA");

const displayDate = (dateStr: string): string => {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

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
  const [selectedLibItem, setSelectedLibItem] = useState<FoodLibraryItem | null>(null);
  const [libServings, setLibServings] = useState("1");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState<string | null>(null);
  const [pendingPhotoName, setPendingPhotoName] = useState("");
  const [describeQuery, setDescribeQuery] = useState("");
  const [describeAnalyzing, setDescribeAnalyzing] = useState(false);
  const [aiCategory, setAiCategory] = useState("");
  const [photoEstimate, setPhotoEstimate] = useState<null | {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    weight_g: number;
  }>(null);
  const [photoSimilarItems, setPhotoSimilarItems] = useState<FoodLibraryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingMeal, setSavingMeal] = useState(false);

  const [targetsOpen, setTargetsOpen] = useState(false);
  const [targetForm, setTargetForm] = useState({ calorie_target: "1600", protein_target: "120", carb_target: "", fat_target: "" });

  const [quickAddMealType, setQuickAddMealType] = useState("breakfast");
  const [addLibOpen, setAddLibOpen] = useState(false);
  const [libForm, setLibForm] = useState<AddFoodLibraryItemData>({ name: "" });
  const [savingLib, setSavingLib] = useState(false);

  const [editLibOpen, setEditLibOpen] = useState(false);
  const [editLibItem, setEditLibItem] = useState<FoodLibraryItem | null>(null);
  const [editLibForm, setEditLibForm] = useState<AddFoodLibraryItemData>({ name: "" });
  const [savingEditLib, setSavingEditLib] = useState(false);

  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeDescGenerating, setRecipeDescGenerating] = useState(false);
  const [recipeCategory, setRecipeCategory] = useState("");
  const [recipeWeightG, setRecipeWeightG] = useState("");
  const [recipeKcal, setRecipeKcal] = useState("");
  const [recipeProtein, setRecipeProtein] = useState("");
  const [recipeCarbs, setRecipeCarbs] = useState("");
  const [recipeFat, setRecipeFat] = useState("");
  const [recipeSaving, setRecipeSaving] = useState(false);

  const [batchIngredients, setBatchIngredients] = useState<BatchIngredient[]>([emptyIngredient()]);
  const [batchCookedWeight, setBatchCookedWeight] = useState("");
  const [batchServings, setBatchServings] = useState("");

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
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat ?? 0), 0);
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

  const resetMealDialog = () => {
    setAddMealOpen(false);
    setPhotoEstimate(null);
    setPhotoSimilarItems([]);
    setPhotoCaption("");
    setPendingPhotoBase64(null);
    setPendingPhotoName("");
    setDescribeQuery("");
    setAiCategory("");
    setSelectedLibItem(null);
    setLibServings("1");
    setSavingMeal(false);
  };

  const handleSaveMeal = async (aiMode?: "log" | "library") => {
    if (!userId) return;
    setSavingMeal(true);

    const entry = await getOrCreateEntryForDate(userId, selectedDate);
    if (!entry) {
      setSavingMeal(false);
      return;
    }

    if (addMealTab === 0 && selectedLibItem) {
      const mult = parseFloat(libServings) || 1;
      const saved = await addMealWithMacros(entry.id, {
        meal_type: mealType,
        description: selectedLibItem.name,
        calories: selectedLibItem.calories_per_serving ? Math.round(selectedLibItem.calories_per_serving * mult) : null,
        protein: selectedLibItem.protein_per_serving ? selectedLibItem.protein_per_serving * mult : null,
        carbs: selectedLibItem.carbs_per_serving ? selectedLibItem.carbs_per_serving * mult : null,
        fat: selectedLibItem.fat_per_serving ? selectedLibItem.fat_per_serving * mult : null,
        weight_g: selectedLibItem.serving_weight_g ? selectedLibItem.serving_weight_g * mult : null,
        food_library_item_id: selectedLibItem.id,
      });
      if (saved) setMeals((prev) => [...prev, saved]);
    } else if (addMealTab === 1 && photoEstimate) {
      const wt = photoEstimate.weight_g || null;
      const cal = photoEstimate.calories || null;
      const pro = photoEstimate.protein || null;
      const carb = photoEstimate.carbs || null;
      const fat = photoEstimate.fat || null;

      const saved = await addMealWithMacros(entry.id, {
        meal_type: mealType,
        description: photoEstimate.name,
        calories: cal,
        protein: pro,
        carbs: carb,
        fat: fat,
        weight_g: wt,
      });
      if (saved) setMeals((prev) => [...prev, saved]);

      if (aiMode === "library") {
        const libItem = await addFoodLibraryItem(userId, {
          name: photoEstimate.name,
          category: aiCategory || null,
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
    }

    resetMealDialog();
  };

  const applyEstimate = (data: {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    weight_g?: number;
  }) => {
    setPhotoEstimate({ ...data, weight_g: data.weight_g ?? 0 });
    const nameLower = data.name.toLowerCase();
    const similar = library.filter((item) => {
      const itemWords = item.name
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3);
      return itemWords.some((word) => nameLower.includes(word));
    });
    setPhotoSimilarItems(similar);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoEstimate(null);
    setPhotoSimilarItems([]);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setPendingPhotoBase64(base64);
      setPendingPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!pendingPhotoBase64) return;
    setPhotoAnalyzing(true);
    setPhotoEstimate(null);
    setPhotoSimilarItems([]);

    const res = await fetch("/api/meals/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: pendingPhotoBase64, type: "meal", text: photoCaption.trim() || undefined }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        name: string;
        description: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        weight_g?: number;
      };
      applyEstimate(data);
    }
    setPhotoAnalyzing(false);
  };

  const handleDescribeEstimate = async () => {
    if (!describeQuery.trim()) return;
    setDescribeAnalyzing(true);
    setPhotoEstimate(null);
    setPhotoSimilarItems([]);

    const res = await fetch("/api/meals/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: describeQuery.trim(), type: "describe" }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        name: string;
        description: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        weight_g?: number;
      };
      applyEstimate(data);
    }
    setDescribeAnalyzing(false);
  };

  const handleSaveTargets = async () => {
    if (!userId) return;
    const updated = await upsertDailyTargets(userId, {
      calorie_target: parseInt(targetForm.calorie_target) || 1600,
      protein_target: parseInt(targetForm.protein_target) || 120,
      carb_target: targetForm.carb_target ? parseInt(targetForm.carb_target) : null,
      fat_target: targetForm.fat_target ? parseInt(targetForm.fat_target) : null,
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

  const openEditLibItem = (item: FoodLibraryItem) => {
    setEditLibItem(item);
    setEditLibForm({
      name: item.name,
      brand: item.brand,
      category: item.category,
      serving_description: item.serving_description,
      serving_weight_g: item.serving_weight_g,
      calories_per_serving: item.calories_per_serving,
      protein_per_serving: item.protein_per_serving,
      carbs_per_serving: item.carbs_per_serving,
      fat_per_serving: item.fat_per_serving,
      calories_per_100g: item.calories_per_100g,
      protein_per_100g: item.protein_per_100g,
      carbs_per_100g: item.carbs_per_100g,
      fat_per_100g: item.fat_per_100g,
    });
    setEditLibOpen(true);
  };

  const handleCalcPer100g = () => {
    const wt = editLibForm.serving_weight_g;
    if (!wt || wt <= 0) return;
    setEditLibForm((f) => ({
      ...f,
      calories_per_100g: f.calories_per_serving != null ? Math.round((f.calories_per_serving / wt) * 100) : f.calories_per_100g,
      protein_per_100g: f.protein_per_serving != null ? Math.round((f.protein_per_serving / wt) * 1000) / 10 : f.protein_per_100g,
      carbs_per_100g: f.carbs_per_serving != null ? Math.round((f.carbs_per_serving / wt) * 1000) / 10 : f.carbs_per_100g,
      fat_per_100g: f.fat_per_serving != null ? Math.round((f.fat_per_serving / wt) * 1000) / 10 : f.fat_per_100g,
    }));
  };

  const handleSaveEditLibItem = async () => {
    if (!editLibItem) return;
    setSavingEditLib(true);
    const updated = await updateFoodLibraryItem(editLibItem.id, editLibForm);
    if (updated) setLibrary((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSavingEditLib(false);
    setEditLibOpen(false);
    setEditLibItem(null);
  };

  const handleQuickAddToToday = async (item: FoodLibraryItem) => {
    if (!userId) return;
    const entry = await getOrCreateEntryForDate(userId, selectedDate);
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

    if (saved) setMeals((prev) => [...prev, saved]);
  };

  const handleCalcFromIngredients = () => {
    const totalCal = batchIngredients.reduce((s, i) => s + (parseFloat(i.calories) || 0), 0);
    const totalPro = batchIngredients.reduce((s, i) => s + (parseFloat(i.protein) || 0), 0);
    const totalCar = batchIngredients.reduce((s, i) => s + (parseFloat(i.carbs) || 0), 0);
    const totalFat = batchIngredients.reduce((s, i) => s + (parseFloat(i.fat) || 0), 0);
    const servCount = parseInt(batchServings) || 1;
    const cookWeight = parseFloat(batchCookedWeight) || 0;

    setRecipeKcal(String(Math.round(totalCal / servCount)));
    setRecipeProtein(String(Math.round((totalPro / servCount) * 10) / 10));
    setRecipeCarbs(String(Math.round((totalCar / servCount) * 10) / 10));
    setRecipeFat(String(Math.round((totalFat / servCount) * 10) / 10));
    if (cookWeight > 0) setRecipeWeightG(String(Math.round((cookWeight / servCount) * 10) / 10));
  };

  const handleCloseRecipeDialog = () => {
    setRecipeOpen(false);
    setRecipeName("");
    setRecipeDescription("");
    setRecipeDescGenerating(false);
    setRecipeCategory("");
    setRecipeWeightG("");
    setRecipeKcal("");
    setRecipeProtein("");
    setRecipeCarbs("");
    setRecipeFat("");
    setBatchIngredients([emptyIngredient()]);
    setBatchCookedWeight("");
    setBatchServings("");
  };

  const handleGenerateRecipeDesc = async () => {
    if (!recipeName.trim()) return;
    setRecipeDescGenerating(true);
    const res = await fetch("/api/meals/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "recipe",
        recipe: {
          name: recipeName.trim(),
          calories: recipeKcal,
          protein: recipeProtein,
          carbs: recipeCarbs,
          fat: recipeFat,
          weight_g: recipeWeightG,
          category: recipeCategory,
        },
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { description: string };
      setRecipeDescription(data.description);
    }
    setRecipeDescGenerating(false);
  };

  const handleSaveRecipe = async () => {
    if (!userId || !recipeName.trim()) return;
    setRecipeSaving(true);

    const wt = recipeWeightG ? parseFloat(recipeWeightG) : null;
    const cal = recipeKcal ? parseInt(recipeKcal) : null;
    const pro = recipeProtein ? parseFloat(recipeProtein) : null;
    const carb = recipeCarbs ? parseFloat(recipeCarbs) : null;
    const fat = recipeFat ? parseFloat(recipeFat) : null;

    const item = await addFoodLibraryItem(userId, {
      name: recipeName.trim(),
      serving_description: recipeDescription.trim() || null,
      category: recipeCategory || null,
      serving_weight_g: wt,
      calories_per_serving: cal,
      protein_per_serving: pro,
      carbs_per_serving: carb,
      fat_per_serving: fat,
      is_meal_prep: true,
      ...(wt && wt > 0
        ? {
            calories_per_100g: cal != null ? Math.round((cal / wt) * 100) : null,
            protein_per_100g: pro != null ? Math.round((pro / wt) * 1000) / 10 : null,
            carbs_per_100g: carb != null ? Math.round((carb / wt) * 1000) / 10 : null,
            fat_per_100g: fat != null ? Math.round((fat / wt) * 1000) / 10 : null,
          }
        : {}),
    });

    if (item) setLibrary((prev) => [...prev, item]);

    setRecipeSaving(false);
    handleCloseRecipeDialog();
  };

  const filteredLibrary = library.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(libSearch.toLowerCase());
    const matchCat = libCategory === "All" || item.category?.toLowerCase() === libCategory.toLowerCase();
    return matchSearch && matchCat;
  });

  return (
    <Box sx={{ pb: 12 }}>
      <Box sx={{ px: 2, pt: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>
          Nutrition
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ px: 2, mt: 1 }} variant="fullWidth">
        <Tab label="Today" />
        <Tab label="Library" />
        <Tab label="Recipes" />
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

              {targets.carb_target != null && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Carbs</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(totalCarbs)}g / {targets.carb_target}g
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((totalCarbs / targets.carb_target) * 100, 100)}
                    color="warning"
                    sx={{ borderRadius: 2, height: 8 }}
                  />
                </Box>
              )}

              {targets.fat_target != null && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Fat</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(totalFat)}g / {targets.fat_target}g
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((totalFat / targets.fat_target) * 100, 100)}
                    color="error"
                    sx={{ borderRadius: 2, height: 8 }}
                  />
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setTargetForm({
                      calorie_target: String(targets.calorie_target),
                      protein_target: String(targets.protein_target),
                      carb_target: targets.carb_target != null ? String(targets.carb_target) : "",
                      fat_target: targets.fat_target != null ? String(targets.fat_target) : "",
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
                const groupCalories = group.reduce((s, m) => s + (m.calories ?? 0), 0);
                return (
                  <Accordion
                    key={type}
                    defaultExpanded={false}
                    disableGutters
                    elevation={0}
                    sx={{
                      border: "0.5px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      mb: 1.5,
                      "&:before": { display: "none" },
                      "&.Mui-expanded": { borderRadius: 2 },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon fontSize="small" />}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", pr: 1 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>
                          {type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {groupCalories} kcal
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                      {group.map((meal) => (
                        <Box
                          key={meal.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            py: 1,
                            borderBottom: "0.5px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none" },
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
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {meals.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", pt: 4 }}>
                  No meals logged yet
                </Typography>
              )}
            </>
          )}

          <Fab color="primary" sx={{ position: "fixed", bottom: 80, right: 20 }} onClick={() => setAddMealOpen(true)}>
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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.5 }}>
              {filteredLibrary.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    border: "0.5px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3, mb: 0.25 }}>
                    {item.name}
                  </Typography>
                  {item.brand && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.brand}
                    </Typography>
                  )}
                  <Typography variant="caption" fontWeight={600} color="text.primary">
                    {item.calories_per_serving ?? "–"} kcal
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[
                      item.protein_per_serving != null ? `P ${item.protein_per_serving}g` : null,
                      item.carbs_per_serving != null ? `C ${item.carbs_per_serving}g` : null,
                      item.fat_per_serving != null ? `F ${item.fat_per_serving}g` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Typography>
                  {item.serving_description && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {item.serving_description}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: "auto", pt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleQuickAddToToday(item)}
                      sx={{ flex: 1, minWidth: 0, fontSize: "0.75rem", py: 0.5 }}
                    >
                      Add
                    </Button>
                    <IconButton size="small" onClick={() => openEditLibItem(item)} sx={{ p: 0.5 }}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteLibItem(item.id)} sx={{ p: 0.5 }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => setRecipeOpen(true)}
            sx={{ mb: 2 }}
          >
            Add recipe
          </Button>

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

          {library.filter((i) => i.is_meal_prep).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", pt: 4 }}>
              No recipes yet
            </Typography>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.5 }}>
              {library
                .filter((i) => i.is_meal_prep)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      border: "0.5px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3, mb: 0.25 }}>
                      {item.name}
                    </Typography>
                    {item.serving_description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.serving_description}
                      </Typography>
                    )}
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      {item.calories_per_serving ?? "–"} kcal
                      {item.serving_weight_g != null ? ` · ${item.serving_weight_g}g` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[
                        item.protein_per_serving != null ? `P ${item.protein_per_serving}g` : null,
                        item.carbs_per_serving != null ? `C ${item.carbs_per_serving}g` : null,
                        item.fat_per_serving != null ? `F ${item.fat_per_serving}g` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: "auto", pt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickAddToToday(item)}
                        sx={{ flex: 1, minWidth: 0, fontSize: "0.75rem", py: 0.5 }}
                      >
                        Add
                      </Button>
                      <IconButton size="small" onClick={() => openEditLibItem(item)} sx={{ p: 0.5 }}>
                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteLibItem(item.id)} sx={{ p: 0.5 }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </Box>
      )}

      <Dialog open={addMealOpen} onClose={resetMealDialog} fullWidth maxWidth="xs">
        <DialogTitle>Add meal</DialogTitle>
        <DialogContent>
          <Tabs value={addMealTab} onChange={(_, v: number) => setAddMealTab(v)} sx={{ mb: 2 }} variant="fullWidth">
            <Tab label="Library" />
            <Tab label="AI" />
          </Tabs>

          {addMealTab === 0 && (
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
                renderInput={(params) => <TextField {...params} placeholder="Select food…" />}
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

          {addMealTab === 1 && (
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
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
              />
              <Button variant="outlined" fullWidth onClick={() => fileInputRef.current?.click()} sx={{ mb: 1 }}>
                {pendingPhotoName ? `Change photo (${pendingPhotoName})` : "Take photo or choose image"}
              </Button>

              {pendingPhotoBase64 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Describe the image (optional) — e.g. homemade, ~200g portion"
                    fullWidth
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    disabled={photoAnalyzing}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => void handleAnalyzePhoto()}
                    disabled={photoAnalyzing}
                    sx={{ alignSelf: "flex-end" }}
                  >
                    {photoAnalyzing ? <CircularProgress size={16} color="inherit" /> : "Analyze"}
                  </Button>
                </Box>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "center", mb: 1.5 }}
              >
                or describe what you have
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="e.g. 70g of bakery toast with butter and jam"
                  fullWidth
                  multiline
                  minRows={3}
                  value={describeQuery}
                  onChange={(e) => setDescribeQuery(e.target.value)}
                  disabled={describeAnalyzing}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => void handleDescribeEstimate()}
                  disabled={!describeQuery.trim() || describeAnalyzing}
                  sx={{ alignSelf: "flex-end" }}
                >
                  {describeAnalyzing ? <CircularProgress size={16} color="inherit" /> : "Estimate"}
                </Button>
              </Box>

              {photoAnalyzing && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing…
                  </Typography>
                </Box>
              )}

              {photoEstimate && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    {photoEstimate.description}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <TextField
                      size="small"
                      label="Name"
                      fullWidth
                      value={photoEstimate.name}
                      onChange={(e) => setPhotoEstimate((p) => p && { ...p, name: e.target.value })}
                    />
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <Chip
                          key={cat}
                          label={cat}
                          size="small"
                          variant={aiCategory === cat ? "filled" : "outlined"}
                          onClick={() => setAiCategory((prev) => (prev === cat ? "" : cat))}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        size="small"
                        label="kcal"
                        type="number"
                        value={photoEstimate.calories || ""}
                        onChange={(e) => setPhotoEstimate((p) => p && { ...p, calories: Number(e.target.value) })}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="g"
                        type="number"
                        value={photoEstimate.weight_g || ""}
                        onChange={(e) => setPhotoEstimate((p) => p && { ...p, weight_g: Number(e.target.value) })}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        size="small"
                        label="P"
                        type="number"
                        value={photoEstimate.protein || ""}
                        onChange={(e) => setPhotoEstimate((p) => p && { ...p, protein: Number(e.target.value) })}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="C"
                        type="number"
                        value={photoEstimate.carbs || ""}
                        onChange={(e) => setPhotoEstimate((p) => p && { ...p, carbs: Number(e.target.value) })}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="F"
                        type="number"
                        value={photoEstimate.fat || ""}
                        onChange={(e) => setPhotoEstimate((p) => p && { ...p, fat: Number(e.target.value) })}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>

                  {photoSimilarItems.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                        Similar items in your library — use one instead?
                      </Typography>
                      {photoSimilarItems.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 0.75,
                            borderBottom: "0.5px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.calories_per_serving ?? "–"} kcal
                              {item.protein_per_serving != null ? ` · P ${item.protein_per_serving}g` : ""}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedLibItem(item);
                              setLibServings("1");
                              setAddMealTab(0);
                            }}
                          >
                            Use this
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mt: 2.5, justifyContent: "flex-end" }}>
            <Button onClick={resetMealDialog}>Cancel</Button>
            {addMealTab === 1 && photoEstimate ? (
              <>
                <Button variant="outlined" disabled={savingMeal} onClick={() => void handleSaveMeal("log")}>
                  {savingMeal ? "Saving…" : "Log once"}
                </Button>
                <Button variant="contained" disabled={savingMeal} onClick={() => void handleSaveMeal("library")}>
                  {savingMeal ? "Saving…" : "Add to library"}
                </Button>
              </>
            ) : (
              <Button variant="contained" disabled={savingMeal} onClick={() => void handleSaveMeal()}>
                {savingMeal ? "Saving…" : "Save"}
              </Button>
            )}
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
            <TextField
              size="small"
              label="Carbs target (g)"
              type="number"
              fullWidth
              value={targetForm.carb_target}
              onChange={(e) => setTargetForm((f) => ({ ...f, carb_target: e.target.value }))}
            />
            <TextField
              size="small"
              label="Fat target (g)"
              type="number"
              fullWidth
              value={targetForm.fat_target}
              onChange={(e) => setTargetForm((f) => ({ ...f, fat_target: e.target.value }))}
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

      <Dialog open={recipeOpen} onClose={handleCloseRecipeDialog} fullWidth maxWidth="xs">
        <DialogTitle>Add recipe</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
            <TextField
              size="small"
              label="Recipe name *"
              fullWidth
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              autoFocus
            />
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <TextField
                size="small"
                label="Description"
                fullWidth
                placeholder="e.g. High-protein meal prep, great with rice"
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                disabled={recipeDescGenerating}
              />
              <IconButton
                size="small"
                onClick={() => void handleGenerateRecipeDesc()}
                disabled={!recipeName.trim() || recipeDescGenerating}
                title="Generate description"
                sx={{ mt: 0.5, flexShrink: 0 }}
              >
                {recipeDescGenerating ? (
                  <CircularProgress size={16} />
                ) : (
                  <AutoAwesomeRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  variant={recipeCategory === cat ? "filled" : "outlined"}
                  onClick={() => setRecipeCategory((prev) => (prev === cat ? "" : cat))}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Per serving
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Weight (g)"
                type="number"
                value={recipeWeightG}
                onChange={(e) => setRecipeWeightG(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="kcal"
                type="number"
                value={recipeKcal}
                onChange={(e) => setRecipeKcal(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Protein (g)"
                type="number"
                value={recipeProtein}
                onChange={(e) => setRecipeProtein(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Carbs (g)"
                type="number"
                value={recipeCarbs}
                onChange={(e) => setRecipeCarbs(e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Fat (g)"
                type="number"
                value={recipeFat}
                onChange={(e) => setRecipeFat(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>

            <Accordion
              disableGutters
              elevation={0}
              sx={{ border: "0.5px solid", borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon fontSize="small" />}>
                <Typography variant="caption" color="text.secondary">
                  Calculate from ingredients
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {batchIngredients.map((ing, idx) => (
                  <Box key={idx} sx={{ display: "flex", gap: 0.75, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                    <TextField
                      size="small"
                      label="Name"
                      value={ing.name}
                      onChange={(e) => {
                        const next = [...batchIngredients];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setBatchIngredients(next);
                      }}
                      sx={{ width: 110 }}
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
                      sx={{ width: 66 }}
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
                      sx={{ width: 56 }}
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
                      sx={{ width: 56 }}
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
                      sx={{ width: 56 }}
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
                  sx={{ mb: 1.5 }}
                >
                  Add ingredient
                </Button>
                <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
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
                <Button variant="outlined" size="small" onClick={handleCalcFromIngredients}>
                  Calculate → fill above
                </Button>
              </AccordionDetails>
            </Accordion>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2.5, justifyContent: "flex-end" }}>
            <Button onClick={handleCloseRecipeDialog}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!recipeName.trim() || recipeSaving}
              onClick={() => void handleSaveRecipe()}
            >
              {recipeSaving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={editLibOpen} onClose={() => setEditLibOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit {editLibItem?.is_meal_prep ? "recipe" : "food item"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
            <TextField
              size="small"
              label="Name *"
              fullWidth
              value={editLibForm.name}
              onChange={(e) => setEditLibForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              size="small"
              label="Brand"
              fullWidth
              value={editLibForm.brand ?? ""}
              onChange={(e) => setEditLibForm((f) => ({ ...f, brand: e.target.value || null }))}
            />
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={editLibForm.category ?? ""}
              onChange={(e: SelectChangeEvent) => setEditLibForm((f) => ({ ...f, category: e.target.value || null }))}
            >
              <MenuItem value=""><em>Category</em></MenuItem>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <TextField
              size="small"
              label="Serving description"
              fullWidth
              value={editLibForm.serving_description ?? ""}
              onChange={(e) => setEditLibForm((f) => ({ ...f, serving_description: e.target.value || null }))}
            />
            <Typography variant="caption" color="text.secondary">Per serving</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Weight (g)"
                type="number"
                value={editLibForm.serving_weight_g ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, serving_weight_g: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="kcal"
                type="number"
                value={editLibForm.calories_per_serving ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, calories_per_serving: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Protein (g)"
                type="number"
                value={editLibForm.protein_per_serving ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, protein_per_serving: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Carbs (g)"
                type="number"
                value={editLibForm.carbs_per_serving ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, carbs_per_serving: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Fat (g)"
                type="number"
                value={editLibForm.fat_per_serving ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, fat_per_serving: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Per 100g</Typography>
              <Button
                size="small"
                variant="text"
                disabled={!editLibForm.serving_weight_g}
                onClick={handleCalcPer100g}
                sx={{ fontSize: "0.7rem", py: 0 }}
              >
                Calculate from serving
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="kcal"
                type="number"
                value={editLibForm.calories_per_100g ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, calories_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Protein (g)"
                type="number"
                value={editLibForm.protein_per_100g ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, protein_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Carbs (g)"
                type="number"
                value={editLibForm.carbs_per_100g ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, carbs_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Fat (g)"
                type="number"
                value={editLibForm.fat_per_100g ?? ""}
                onChange={(e) => setEditLibForm((f) => ({ ...f, fat_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2.5, justifyContent: "flex-end" }}>
            <Button onClick={() => setEditLibOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={!editLibForm.name || savingEditLib} onClick={() => void handleSaveEditLibItem()}>
              {savingEditLib ? "Saving…" : "Save"}
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
              onChange={(e: SelectChangeEvent) => setLibForm((f) => ({ ...f, category: e.target.value || null }))}
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
            <Button variant="contained" disabled={!libForm.name || savingLib} onClick={handleAddLibItem}>
              {savingLib ? "Saving…" : "Save"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default NutritionPage;
