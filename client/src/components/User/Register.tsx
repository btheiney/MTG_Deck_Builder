import { ChangeEvent, FormEvent, useState } from "react";
import API_LOCAL_URL from "../../Utils/API_URL";
import { useNavigate, Link } from "react-router-dom";
import './user.css'

interface IRegisterUser {
  username: string;
  password: string;
  confirm_password: string;
}

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<IRegisterUser>({
    username: "",
    password: "",
    confirm_password: "",
  });

  const [registrationError, setRegistrationError] = useState(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(API_LOCAL_URL("members/register"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      navigate(`/login`);
    } else {
        console.log(data.error)
      setRegistrationError(data.error);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newFormData: IRegisterUser = { ...formData };
    newFormData[e.target.id as keyof IRegisterUser] = e.target.value;
    console.log(newFormData)
    setFormData(newFormData);
  }

  return (
    <div className="form-container">
      {<p>{registrationError}</p>}
        <form onSubmit={submit}>
          <fieldset>
            <legend>Register</legend>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              onChange={handleChange}
              value={formData.username}
              className="form-control"
              id="username"
              placeholder="Enter Username"
            />
            <label>Password</label>
            <input
              type="password"
              onChange={handleChange}
              className="form-control"
              id="password"
              placeholder="Enter Password"
            />
          </div>

          <div className="form-group mb-2">
            <label>Confirm Password</label>
            <input
              type="password"
              onChange={handleChange}
              className="form-control"
              id="confirm_password"
              placeholder="Confirm Password"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Register
          </button>
          <p className="message">Already registered? <Link to="/login">Login Here</Link></p>
          </fieldset>
        </form>
    </div>
  );
}

export default Register;
