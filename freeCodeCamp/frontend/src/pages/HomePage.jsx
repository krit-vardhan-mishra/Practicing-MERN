import React, { useEffect, useState } from 'react'
import { setPageTitle } from '../lib/utils'
import toast from 'react-hot-toast'
import NavBar from '../components/NavBar';
import RateLimitedUi from '../components/RateLimitedUi';
import axios from "axios";
import NoteCard from '../components/NoteCard';

const HomePage = () => {
  setPageTitle("Home Page");

  const [isRatedLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await axios.get("http://localhost:5002/api/notes")
        console.log(res.data);
        setNotes(res.data);
        setIsRateLimited(false);
      } catch (error) {
        console.error("Error while fetching data:" + error);
        if (error.response?.status === 429) {
          setIsRateLimited(true)
        } else {
          toast.error("failed to load notes")
        }
      }
      finally {
        setLoading(false);
      }
    }

    fetchNotes()
  }, [])

  return (
    <div className='min-h-screen'>
      <NavBar />

      {isRatedLimited && <RateLimitedUi />}

      <div className='max-w-7xl mx-auto p-4 mt-6'>
        {loading && <div className='text-center text-primary py-10'>Loading notes...</div>}
        {notes.length > 0 && !isRatedLimited && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {notes.map(note => (
              <div key={note._id}>
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage