import { ChangeEvent, FormEvent, useState } from "react";
import API_LOCAL_URL from "../../Utils/API_URL";
import { useLocation, useNavigate } from "react-router-dom";
import { checkLogin } from "../../services/checkLogin";
// import { isLoggedInContext } from "../hooks/useIsLoggedIn";

interface ILoginUser {
  username: string;
  password: string;
}

function Login({setToken}: {setToken?: Function}) {
  const navigate = useNavigate();

  // const {username, setUsername} = useContext<IUser>(isLoggedInContext)

  const [isLoggedInError, setIsLoggedInError] = useState<string>("");


  const [formData, setFormData] = useState<ILoginUser>({
    username: "",
    password: "",
  });

  // async function checkLogin() {
  //   const res = await fetch(API_LOCAL_URL("checkLogin"), {
  //     method: "GET",
  //     credentials: "include",
  //     headers: {
  //       Accept: "application/json",
  //       "Content-Type": "application/json",
  //     },
  //   });

  //   const data = await res.json();
  //   console.log(data);
  //   setIsLoggedInError(() =>
  //     data.username
  //       ? "logged"
  //       : "You have entered an invalid username or password"
  //   );
  //   if (data.username) {
  //     localStorage.setItem("username", data.username);
  //     console.log("data.username: " + data.username)
  //     // setUsername(data.username);
  //     navigate(`/`);
  //   }
  // }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(API_LOCAL_URL("members/authenticate"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json()
    if(!data.success) {
      setIsLoggedInError("Invalid username or password");
    }
    navigate("/");
    checkLogin();
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newFormData: ILoginUser = { ...formData };
    newFormData[e.target.id as keyof ILoginUser] = e.target.value;
    setFormData(newFormData);
  }

  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <p>{isLoggedInError}</p>
        <form onSubmit={submit}>
          <div className="form-group mb-2">
            <label>Username</label>
            <input
              type="text"
              onChange={handleChange}
              value={formData.username}
              className="form-control"
              id="username"
              placeholder="Enter Username"
            />
          </div>

          <div className="form-group mb-2">
            <label>Password</label>
            <input
              type="password"
              onChange={handleChange}
              value={formData.password}
              className="form-control"
              id="password"
              placeholder="Enter Password"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;