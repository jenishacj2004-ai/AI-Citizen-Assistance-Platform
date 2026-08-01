import { useState } from "react";
import api from "../services/api";

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
    <div>
      <h2>User Registration</h2>

     <form onSubmit={handleSubmit}>

        <label>Full Name</label><br />
        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange}/>

        <label>Email</label><br />
        <input type="email" name="email" value={formData.email} onChange={handleChange} />

        <label>Password</label><br />
        <input type="password" name="password" value={formData.password} onChange={handleChange}/>
        <br /><br />

        <label>Phone</label><br />
        <input type="text" name="phone" value={formData.phone} onChange={handleChange}/>
        <br /><br />

        <label>Gender</label><br />
        <select name="gender" value={formData.gender} onChange={handleChange}>
            
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select><br /><br />

        <label>Date of Birth</label><br />
        <input type="date"
  name="dob"
  value={formData.dob}
  onChange={handleChange}/><br /><br />

        <label>Category</label><br />
        <select name="category" value={formData.category} onChange={handleChange}>
          <option>General</option>
          <option>OBC</option>
          <option>SC</option>
          <option>ST</option>
          <option>EWS</option>
          <option>Other</option>
        </select><br /><br />

        <label>State</label><br />
        <input type="text" name="state" value={formData.state} onChange={handleChange}/><br /><br />

        <label>District</label><br />
        <input type="text"  name="district" value={formData.district} onChange={handleChange}/><br /><br />

        <label>Occupation</label><br />
        <input type="text" name="occupation" value={formData.occupation}onChange={handleChange}/><br /><br />

        <label>Annual Income</label><br />
        <input type="number"  name="annual_income" value={formData.annual_income} onChange={handleChange}/><br /><br />

        <button type="submit">Register</button>

      </form>
    </div>
  );
}

export default Register;