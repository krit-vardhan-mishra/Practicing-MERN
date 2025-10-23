'use client'

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UserProfilePage({ params }: any) {

    const router = useRouter();
    const [data, setData] = useState("nothing");

    const logout = async () => {
        try {
            await axios.get("/api/users/logout")
            toast.success("Logout successful");
            router.push("/login");
        } catch (error: any) {
            console.log(error.message)
            toast.error(error.message);
        }
    }

    const getUserDetails = async () => {
        const res = await axios.get('api/users/me');
        console.log(res.data);
        setData(res.data.data._id);
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className='text-4xl'>User Profile Page</h1> 
            <h3>{data === "nothing" ? "nothing" : <Link href={`/profile/${data}`} className="text-blue-500 hover:underline">{data}</Link>}</h3>
            <hr />
            <br />
            <p className='text-lg'>User ID: <span className='font-bold p-2 ml-2 rounded bg-orange-500'>{params._id}</span></p>
            <br />
            <br />
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 transition duration-200 text-white p-2 rounded-lg">Logout</button>
            <button onClick={getUserDetails} className="bg-blue-500 hover:bg-blue-600 transition duration-200 text-white p-2 rounded-lg">Get User Details</button>
        </div>
    );
}