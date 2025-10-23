'use client'

import { TextField } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { set } from "mongoose";

export default function LoginPage() {
    const router = useRouter();
    const [user, setUser] = useState({
        email: "",
        password: "",
    });

    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user.email.length > 0 && user.password.length > 0) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [user]);

    const onLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await axios.post("api/users/login", user);
            toast.success("Login successful");
            router.push(`/profile/${response.data.user._id}`);
        } catch (error: any) {
            console.error("Login failed", error);
            console.log("Login failed", error.message);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1>{isLoading ? "Processing..." : "Login Page"}</h1>

            <hr />
            <form
                className="flex flex-col w-96 p-4 bg-white text-black shadow-md rounded-lg"
                onSubmit={onLogin}
            >
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
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 transition duration-200 text-white px-4 py-2 rounded-lg self-center"
                >
                    {buttonDisabled ? "Fill the form" : "Login"}
                </button>
            </form>
            <p className="mt-4 text-gray-200">
                Don't have an account? <Link href="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
            </p>
        </div>
    );
}
