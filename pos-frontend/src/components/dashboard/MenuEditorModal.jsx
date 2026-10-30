import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { addMenuCategory, addMenuItem, getMenu, updateMenuItem } from "../../https";

const MenuEditorModal = ({ type, categories, initialItem, onClose }) => {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
    enabled: !categories.length
  });
  const availableCategories = categories.length
    ? categories
    : categoriesQuery.data?.data?.data ?? categories;
  const [form, setForm] = useState({
    categoryId: initialItem?.categoryId ?? categories[0]?._id ?? "",
    name: initialItem?.name ?? "",
    price: initialItem?.price ?? "",
    foodCategory: initialItem?.category ?? "Uncategorized",
    bgColor: "#383838",
    icon: "🍽️"
  });
  const isEditing = type === "edit";
  const isCategory = type === "category";

  useEffect(() => {
    if (!form.categoryId && availableCategories.length) {
      setForm((current) => ({ ...current, categoryId: availableCategories[0]._id }));
    }
  }, [availableCategories, form.categoryId]);

  const mutation = useMutation({
    mutationFn: () => {
      if (isCategory) {
        return addMenuCategory({ name: form.name, bgColor: form.bgColor, icon: form.icon });
      }
      if (!isEditing && !form.categoryId) {
        throw new Error("Add a menu category before adding a dish.");
      }
      const item = { name: form.name, price: form.price, category: form.foodCategory };
      return isEditing
        ? updateMenuItem({ id: initialItem.id, ...item })
        : addMenuItem({ categoryId: form.categoryId, ...item });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      enqueueSnackbar(response.data.message, { variant: "success" });
      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || error.message || "Could not save menu changes.", { variant: "error" });
    }
  });

  const title = isCategory ? "Add category" : isEditing ? "Edit dish" : "Add dish";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="w-full max-w-lg space-y-4 rounded-lg bg-[#262626] p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-white" aria-label="Close dialog">×</button>
        </div>
        {isCategory ? (
          <>
            <label className="block text-sm text-[#ababab]">
              Category name
              <input
                autoFocus
                required
                maxLength={60}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-2 w-full rounded bg-[#1f1f1f] p-3 text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-[#ababab]">
                Category color
                <input type="color" value={form.bgColor} onChange={(event) => setForm({ ...form, bgColor: event.target.value })} className="mt-2 block h-11 w-full rounded bg-[#1f1f1f] p-1" />
              </label>
              <label className="block text-sm text-[#ababab]">
                Icon
                <input maxLength={8} value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} className="mt-2 w-full rounded bg-[#1f1f1f] p-3 text-white" />
              </label>
            </div>
          </>
        ) : (
          <>
            {!isEditing && (
              <label className="block text-sm text-[#ababab]">
                Menu category
                <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="mt-2 w-full rounded bg-[#1f1f1f] p-3 text-white">
                    {availableCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm text-[#ababab]">
              Dish name
              <input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded bg-[#1f1f1f] p-3 text-white" />
            </label>
            <label className="block text-sm text-[#ababab]">
              Price (₹)
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-2 w-full rounded bg-[#1f1f1f] p-3 text-white" />
            </label>
            <label className="block text-sm text-[#ababab]">
              Food type
              <input maxLength={40} value={form.foodCategory} onChange={(event) => setForm({ ...form, foodCategory: event.target.value })} className="mt-2 w-full rounded bg-[#1f1f1f] p-3 text-white" />
            </label>
          </>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded px-4 py-2 text-[#ababab]">Cancel</button>
          <button disabled={mutation.isPending} type="submit" className="rounded bg-[#f6b100] px-4 py-2 font-semibold text-[#1f1f1f] disabled:opacity-50">
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuEditorModal;
