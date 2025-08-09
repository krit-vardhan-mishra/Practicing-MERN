export default function UserProfilePage({ params }: any) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className='text-4xl'>User Profile Page</h1>
            <hr />
            <br />
            <p className='text-lg'>User ID: <span className='font-bold p-2 ml-2 rounded bg-orange-500'>{params.id}</span></p>
        </div>
    );
}