import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { deleteMenuItem, getMenu } from "../../https";
import MenuEditorModal from "./MenuEditorModal";

const MenuCatalog = () => {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const { data: response, isLoading, isError } = useQuery({ queryKey: ["menu"], queryFn: getMenu });
  const categories = response?.data?.data ?? [];
  const removeMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      enqueueSnackbar("Dish removed.", { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(error.response?.data?.message || error.message, { variant: "error" })
  });

  if (isLoading) return <p className="p-6 text-[#ababab]">Loading menu catalog...</p>;
  if (isError) return <p className="p-6 text-red-400">Menu catalog could not be loaded.</p>;

  return (
    <div className="container mx-auto space-y-4 px-4">
      {categories.map((category) => (
        <section key={category._id} className="rounded-lg bg-[#262626] p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">{category.icon} {category.name}</h2>
          {category.items.map((item) => (
            <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#3b3b3b] py-3 text-white">
              <div>
                <p>{item.name}</p>
                <p className="text-sm text-[#ababab]">{item.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <span>₹{Number(item.price).toFixed(2)}</span>
                <button type="button" onClick={() => setEditor({ type: "edit", item: { id: item._id, categoryId: category._id, ...item } })} className="rounded bg-[#383838] px-3 py-2">Edit</button>
                <button
                  type="button"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Remove ${item.name} from the menu?`)) {
                      removeMutation.mutate(item._id);
                    }
                  }}
                  className="rounded bg-[#5b2626] px-3 py-2 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {!category.items.length && <p className="text-sm text-[#ababab]">No dishes in this category.</p>}
        </section>
      ))}
      {editor && (
        <MenuEditorModal
          type={editor.type}
          initialItem={editor.item}
          categories={categories}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
};

export default MenuCatalog;
