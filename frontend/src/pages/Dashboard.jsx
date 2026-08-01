import { Link } from "react-router-dom";

function Dashboard() {

    const name = localStorage.getItem("user_name");

    return (
        <div>

            <h2>Dashboard</h2>

            <h3>Welcome {name}</h3>

            <br />

            <Link to="/profile">
                <button>View Profile</button>
            </Link>

        </div>
    );
}

export default Dashboard;