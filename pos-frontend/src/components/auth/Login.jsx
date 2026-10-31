import { useState } from "react";
import { useMutation } from "@tanstack/react-query"
import { login } from "../../https/index"
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
 
const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const[formData, setFormData] = useState({
      email: "",
      password: "",
    });
  
    const handleChange = (e) => {
      setFormData({...formData, [e.target.name]: e.target.value});
    }

  
    const handleSubmit = (e) => {
      e.preventDefault();
      loginMutation.mutate(formData);
    }

    const loginMutation = useMutation({
      mutationFn: (reqData) => login(reqData),
      onSuccess: (res) => {
          const { data } = res;
          console.log(data);
          if (data.token) {
            localStorage.setItem("pos_token", data.token);
          }
          const { _id, name, email, phone, role } = data.data;
          dispatch(setUser({ _id, name, email, phone, role }));
          navigate("/");
      },
      onError: (error) => {
        enqueueSnackbar(
          error.response?.data?.message || error.message || "Sign in failed.",
          { variant: "error" }
        );
      }
    })

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
            Employee Email
          </label>
          <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter employee email"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
            Password
          </label>
          <div className="flex item-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="bg-transparent flex-1 text-white focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg mt-6 py-3 text-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold transition-all shadow-lg active:scale-95"
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </button>

        {/* Quick Demo Credentials for College Examiner Presentation */}
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3 text-center">
            ⚡ Quick Demo Accounts (1-Click Login)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                const creds = { email: "admin@restro.com", password: "admin123" };
                setFormData(creds);
                loginMutation.mutate(creds);
              }}
              className="bg-[#242424] hover:bg-zinc-800 border border-zinc-700/60 rounded-lg p-2.5 text-center transition-all group"
            >
              <span className="block text-base">👑</span>
              <span className="block text-xs font-semibold text-yellow-400 group-hover:underline">Admin</span>
              <span className="block text-[10px] text-zinc-400">Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const creds = { email: "cashier@restro.com", password: "cashier123" };
                setFormData(creds);
                loginMutation.mutate(creds);
              }}
              className="bg-[#242424] hover:bg-zinc-800 border border-zinc-700/60 rounded-lg p-2.5 text-center transition-all group"
            >
              <span className="block text-base">💵</span>
              <span className="block text-xs font-semibold text-emerald-400 group-hover:underline">Cashier</span>
              <span className="block text-[10px] text-zinc-400">Billing & Orders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const creds = { email: "waiter@restro.com", password: "waiter123" };
                setFormData(creds);
                loginMutation.mutate(creds);
              }}
              className="bg-[#242424] hover:bg-zinc-800 border border-zinc-700/60 rounded-lg p-2.5 text-center transition-all group"
            >
              <span className="block text-base">🍽️</span>
              <span className="block text-xs font-semibold text-sky-400 group-hover:underline">Waiter</span>
              <span className="block text-[10px] text-zinc-400">Orders & Tables</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
