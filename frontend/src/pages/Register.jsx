import { useState } from "react";
import { useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import { FaBrain, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { registerUser } from "../api/ResumeService";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Please fill all fields"); return; }
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const data = await registerUser(form.name, form.email, form.password);
      // store token returned from register
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify({ name: data.name, email: data.email }));
      toast.success("Account created! 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaBrain className="text-primary text-3xl" />
            <h1 className="text-2xl font-bold">AI Resume Builder</h1>
          </div>
          <h2 className="text-xl font-semibold text-center mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Full Name</span></label>
              <div className="input input-bordered flex items-center gap-2">
                <FaUser className="text-base-content/50" />
                <input type="text" name="name" placeholder="John Doe" className="grow"
                  value={form.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <div className="input input-bordered flex items-center gap-2">
                <FaEnvelope className="text-base-content/50" />
                <input type="email" name="email" placeholder="you@example.com" className="grow"
                  value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Password</span></label>
              <div className="input input-bordered flex items-center gap-2">
                <FaLock className="text-base-content/50" />
                <input type="password" name="password" placeholder="Min 6 characters" className="grow"
                  value={form.password} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Confirm Password</span></label>
              <div className="input input-bordered flex items-center gap-2">
                <FaLock className="text-base-content/50" />
                <input type="password" name="confirm" placeholder="Repeat password" className="grow"
                  value={form.confirm} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner" /> : "Create Account"}
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary font-semibold">Sign in</Link>
          </p>
          <p className="text-center text-sm mt-2">
            <Link to="/generate-resume" className="link link-ghost text-xs">
              Continue without account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
