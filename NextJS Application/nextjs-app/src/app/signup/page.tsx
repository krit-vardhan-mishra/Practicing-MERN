'use client'

import { TextField } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SignupPage() {
    const router = useRouter();
    const [user, setUser] = useState({
        email: "",
        password: "",
        username: "",
    });

    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user.email.length > 0 && user.password.length > 0 && user.username.length > 0) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [user]);

    const onSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await axios.post("api/users/signup", user);
            console.log("Signup Success", response.data);
            router.push("/login");
        } catch (error: any) {
            console.log("Signup failed", error.message);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
        toast.success("Signup successful!");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1>{isLoading ? "Processing..." : "Signup Page"}</h1>

            <hr />
            <form className="flex flex-col w-96 p-4 bg-white text-black shadow-md rounded-lg">
                <TextField
                    label="Username"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={user.username}
                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                    className="rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
                <TextField
                    label="Password"
                    type="password"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                />
                <button onClick={onSignup} className="bg-blue-500 hover:bg-blue-600 transition duration-200 text-white p-2 rounded-lg">{buttonDisabled ? "No Signup" : "Sign Up"}</button>
            </form >
            <p className="mt-4 text-gray-200">Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Login</Link></p>
        </div>
    );
}