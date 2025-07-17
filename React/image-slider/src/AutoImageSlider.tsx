import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import DarkKnight from '../assets/images/dark-knight.jpg';
import Dunkirk from '../assets/images/dunkirk.jpg';
import Seven from '../assets/images/seven.jpg';
import SocialNetwork from '../assets/images/social-network.jpg';
import PulpFiction from '../assets/images/pulp-fiction.jpg';
import SardarUdham from '../assets/images/sardar-udham.jpg';

const AutoImageSlider = () => {
  const movies = [
    {
      title: 'The Dark Knight',
      image: DarkKnight,
      description: 'A brooding vigilante faces the chaos unleashed by the Joker in Gotham City. Directed by Christopher Nolan.'
    },
    {
      title: 'Dunkirk',
      image: Dunkirk,
      description: 'Allied soldiers from Belgium, the British Empire, and France are surrounded by the German Army in WWII. A gripping war thriller.'
    },
    {
      title: 'Seven',
      image: Seven,
      description: 'Two detectives hunt a serial killer who uses the seven deadly sins as his modus operandi.'
    },
    {
      title: 'The Social Network',
      image: SocialNetwork,
      description: 'The rise of Facebook and the personal betrayals that followed. Directed by David Fincher.'
    },
    {
      title: 'Pulp Fiction',
      image: PulpFiction,
      description: 'An intertwining tale of crime, redemption, and pop-culture references. Directed by Quentin Tarantino.'
    },
    {
      title: 'Sardar Udham',
      image: SardarUdham,
      description: 'A biographical drama about Udham Singh, who assassinated Michael O\'Dwyer in London to avenge the Jallianwala Bagh massacre.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, movies.length]);

  const goToSlide = (index) => setCurrentIndex(index);
  const goToPrevious = () => setCurrentIndex((prevIndex) => prevIndex === 0 ? movies.length - 1 : prevIndex - 1);
  const goToNext = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
  const togglePlayPause = () => setIsPlaying(!isPlaying);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    active: {
      scale: 1.1,
      y: -10,
      zIndex: 30,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20, duration: 0.6 }
    },
    adjacent: {
      scale: 1,
      y: 0,
      zIndex: 20,
      opacity: 0.8,
      transition: { type: "spring", stiffness: 300, damping: 20, duration: 0.6 }
    },
    inactive: {
      scale: 0.9,
      y: 10,
      zIndex: 10,
      opacity: 0.6,
      transition: { type: "spring", stiffness: 300, damping: 20, duration: 0.6 }
    }
  };

  const dotVariants = {
    active: {
      scale: 1.2,
      backgroundColor: "#34d399",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    inactive: {
      scale: 1,
      backgroundColor: "#9ca3af",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  return (
    <motion.div
      className="h-screen w-screen relative overflow-hidden font-inter"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentMovie.image})` }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <motion.nav
        className="relative z-20 flex justify-between items-center p-6"
        variants={itemVariants}
      >
        <div className="flex space-x-8">
          {['Home', 'About', 'Portfolio', 'Services', 'Contact'].map((item, index) => (
            <motion.a
              key={item}
              href="#"
              className={`px-4 py-2 rounded font-medium transition-colors ${index === 0 ? 'text-white bg-gray-700' : 'text-white hover:text-emerald-300'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item}
            </motion.a>
          ))}
        </div>
      </motion.nav>

      <div className="relative z-10 flex items-end justify-between h-screen px-12 pb-40 gap-8">
        <motion.div className="flex-1 max-w-2xl" variants={itemVariants}>
          <motion.h1
            className="text-6xl font-bold text-white mb-4 leading-tight"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            MOVIE SLIDER
          </motion.h1>
          <motion.h2
            className="text-5xl font-bold text-gray-400 mb-6"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {currentMovie.title}
          </motion.h2>
          <motion.p
            className="text-gray-300 text-lg mb-8 leading-relaxed"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {currentMovie.description}
          </motion.p>
          <motion.button
            className="bg-white text-gray-800 px-8 py-3 font-medium rounded-md shadow-lg"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            whileHover={{
              scale: 1.05,
              backgroundColor: "#f3f4f6",
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            SEE MORE
          </motion.button>
        </motion.div>

        <motion.div className="flex-1 flex justify-center items-center" variants={itemVariants}>
          <div className="relative pt-32">
            <div className="flex space-x-4 items-end">
              {movies.map((movie, index) => {
                const isActive = index === currentIndex;
                let variant = 'inactive';
                let cardSize = 'w-32 h-48';

                if (isActive) {
                  variant = 'active';
                  cardSize = 'w-48 h-64';
                } else {
                  variant = 'adjacent';
                  cardSize = 'w-32 h-48';
                }

                return (
                  <motion.div
                    key={index}
                    className={`${cardSize} rounded-lg m-2 overflow-hidden shadow-2xl cursor-pointer`}
                    variants={cardVariants}
                    animate={variant}
                    onClick={() => goToSlide(index)}
                    whileHover={{
                      scale: isActive ? 1.15 : 1.05,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    layout
                  >
                    <motion.img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full h-full object-cover m-2"
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              className="flex justify-center space-x-2 mt-4"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {movies.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="w-3 h-3 rounded-full"
                  variants={dotVariants}
                  animate={index === currentIndex ? 'active' : 'inactive'}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AutoImageSlider;