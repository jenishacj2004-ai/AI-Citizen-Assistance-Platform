import { useState } from "react";
import api from "../services/api";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    gender: "Male",
    dob: "",
    category: "General",
    state: "",
    district: "",
    occupation: "",
    annual_income: 0,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/register", formData);

      alert(response.data.message);
    } catch (error) {
      if (error.response) {
        console.log(error.response.data);
        alert(JSON.stringify(error.response.data, null, 2));
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">

        <h2>Create Account</h2>
        <p className="register-subtitle">
          Register to access citizen services
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option>General</option>
              <option>OBC</option>
              <option>SC</option>
              <option>ST</option>
              <option>EWS</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>District</label>
              <input
                type="text"
                name="district"
                placeholder="District"
                value={formData.district}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-group">
            <label>Occupation</label>
            <input
              type="text"
              name="occupation"
              placeholder="Enter your occupation"
              value={formData.occupation}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Annual Income</label>
            <input
              type="number"
              name="annual_income"
              placeholder="Enter annual income"
              value={formData.annual_income}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="register-button">
            Register
          </button>

        </form>
      </div>
    </div>
  );
}

export default Register;