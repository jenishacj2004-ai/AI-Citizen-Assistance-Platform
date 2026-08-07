import { useState, useEffect } from "react";
import api from "../services/api";


function AIRecommendation() {

    const [formData, setFormData] = useState({
        service_type: "Scheme",
        query: ""
    });

    const [profile, setProfile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {

    const fetchProfile = async () => {

        try {

            const user_id = localStorage.getItem("user_id");

            const response = await api.get(`/profile/${user_id}`);

            setProfile(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    fetchProfile();

        }, []);

    const handleChange = (e) => {

        setFormData({

            ...formData,
            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {
    e.preventDefault();

    const requestData = {
        user_id: localStorage.getItem("user_id"),
        service_type: formData.service_type,
        query: formData.query,
    };

    try {

        setLoading(true);
        setResult(null);

        const response = await api.post(
            "/recommend-services",
            requestData
        );

        setResult(response.data);

    } catch (error) {

        console.log(error.response?.data);

    } finally {

        setLoading(false);

    }
 };


    return (

        <div>

            <h2>AI Government Service Recommendation</h2>

            {profile && (

            <div
                style={{
                     border: "1px solid #ccc",
                     padding: "15px",
                     marginBottom: "20px",
                     borderRadius: "8px",
                     backgroundColor: "#f8f9fa"
                 }}
            >

            <h3>Citizen Profile</h3>

             <p><strong>Name:</strong> {profile.full_name}</p>

            <p><strong>Gender:</strong> {profile.gender}</p>

            <p><strong>Occupation:</strong> {profile.occupation}</p>

            <p><strong>Annual Income:</strong> ₹{profile.annual_income}</p>

            <p><strong>Category:</strong> {profile.category}</p>

            <p><strong>State:</strong> {profile.state}</p>

        </div>

    )}

            <form onSubmit={handleSubmit}>


                <label>Service Type</label><br />

                <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                >

                    <option>Scheme</option>
                    <option>Certificate</option>
                    <option>Education</option>
                    <option>Employment</option>
                    <option>Health</option>
                    <option>Agriculture</option>
                    <option>Pension</option>

                </select>

                <br /><br />

                <label>Describe your requirement</label><br />

                <textarea

                    rows="5"
                    cols="40"
                    name="query"
                    value={formData.query}
                    onChange={handleChange}

                />

                <br /><br />

                <button type="submit">

                    Get Recommendation

                </button>

            </form>

            {loading && (
                 <p>Finding the best services for you...</p>
            )}

            {result && (
              <div>

                 <h3>✨ AI Recommendation</h3>

                <p>
                    {result.ai_recommendation}
                </p>

              </div>
            )}

        </div>

    );

}

export default AIRecommendation;