import { useEffect, useState } from "react";
import api from "../services/api";

function Profile() {

    const [user, setUser] = useState({
    phone: "",
    state: "",
    district: "",
    occupation: "",
    annual_income: ""
});

    useEffect(() => {

        const userId = localStorage.getItem("user_id");

        api.get(`/profile/${userId}`)
            .then((response) => {
                setUser(response.data);
            })
            .catch((error) => {
                console.log(error);
            });

    }, []);

    return (
        <div>

            <h2>User Profile</h2>

            <hr />

            <p><strong>Name:</strong> {user.full_name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Gender:</strong> {user.gender}</p>
            <p><strong>Date of Birth:</strong> {user.dob}</p>
            <p><strong>Category:</strong> {user.category}</p>
            <p><strong>State:</strong> {user.state}</p>
            <p><strong>District:</strong> {user.district}</p>
            <p><strong>Occupation:</strong> {user.occupation}</p>
            <p><strong>Annual Income:</strong> ₹{user.annual_income}</p>

        </div>
    );
}

export default Profile;