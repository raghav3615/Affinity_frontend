import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock } from 'react-icons/fi';
import { ExtraContext } from '../context/ExtraContext';
import { useNavigate } from 'react-router-dom';
import { RUST_MAIN_URL } from '../utils/constant.js';

// Predefined problems
const problems = [
  {
    id: 1,
    question: "Given an array of integers, return the sum of all positive numbers.",
    sampleInput: "[1, -2, 3, 4, -5]",
    sampleOutput: "8",
    submitted: false,
  },
  {
    id: 2,
    question: "Write a function to check if a string is a palindrome.",
    sampleInput: "'racecar'",
    sampleOutput: "true",
    submitted: false,
  },
  {
    id: 3,
    question: "Find the largest element in an array.",
    sampleInput: "[3, 1, 4, 1, 5, 9]",
    sampleOutput: "9",
    submitted: false,
  }
];

const CodeRun = () => {
  const [selectedProblem, setSelectedProblem] = useState(problems[0]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [file, setFile] = useState(null);
  const [score, setScore] = useState(0);
  const { user } = useContext(AuthContext);
  const { contestId } = useContext(ExtraContext);
  const navigate = useNavigate();

  // Submit the code to the server
  const handleSubmit = async () => {
    if (selectedProblem.submitted) {
      toast.error(`You have already submitted this problem`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${RUST_MAIN_URL}runcode`, formData);
      
      if (response.data === "AC") {
        setScore(prevScore => {
          const newScore = prevScore + (1000 - (300 - timeLeft));
          return newScore;
        });

        toast.success(`ACCEPTED`);
        setSelectedProblem(prev => ({ ...prev, submitted: true }));
      } else {
        toast.error(`WRONG ANSWER`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Warn user on page leave
  useEffect(() => {
    const handleBeforeUnload = event => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Format seconds into mm:ss
  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle file upload
  const handleUpload = e => {
    const originalFile = e.target.files[0];
    if (!originalFile) return;

    const renamedFile = new File([originalFile], `ques${selectedProblem.id}.py`, {
      type: originalFile.type,
    });
    setFile(renamedFile);
  };

  // Leave contest and update score
  const handleLeave = async () => {
    toast.success("You have completed the contest");
    try {
      await axios.put(`${RUST_MAIN_URL}updatecontestscore`, {
        id: `${contestId}`,
        contestscore: `${score}`,
      });
      navigate('/request');
    } catch (err) {
      console.error("Error leaving contest: ", err.message);
    }
  };

  // Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.1 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-8 shadow-lg h-screen flex flex-col justify-between bg-neutral-900 text-white"
    >
      <motion.header variants={itemVariants} className="mb-6 flex justify-between items-center">
        <div>
          <motion.h1 
            className="text-4xl font-bold text-[#ff0059]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            CodeRun
          </motion.h1>
          <motion.div 
            className="flex items-center text-lg mt-2 text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <FiClock className="mr-2 text-[#ff0059]" />
            <span>Time Left: <span className="font-bold text-white">{formatTime(timeLeft)}</span></span>
          </motion.div>
        </div>
        <motion.div variants={itemVariants}>
          <label className="text-gray-400 mr-2">Select Problem:</label>
          <motion.select
            value={selectedProblem.id}
            onChange={(e) =>
              setSelectedProblem(problems.find(p => p.id === Number(e.target.value)))
            }
            className="bg-neutral-800 text-white p-2 rounded-md outline-none border border-gray-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {problems.map(problem => (
              <option key={problem.id} value={problem.id}>
                Problem {problem.id}
              </option>
            ))}
          </motion.select>
        </motion.div>
      </motion.header>

      <AnimatePresence mode="wait">
        <motion.section 
          key={selectedProblem.id}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="flex-1"
        >
          <motion.h2 
            className="text-2xl font-semibold mb-4"
            whileHover={{ x: 10 }}
          >
            Problem {selectedProblem.id}
          </motion.h2>
          <motion.p 
            className="text-neutral-400 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {selectedProblem.question}
          </motion.p>
          <ProblemDetail title="Sample Input:" content={selectedProblem.sampleInput} />
          <ProblemDetail title="Sample Output:" content={selectedProblem.sampleOutput} />
          
          <motion.label className="block mb-6" variants={itemVariants}>
            <span className="text-gray-400">Upload your code:</span>
            <motion.input
              type="file"
              accept=".js,.py,.cpp"
              onChange={handleUpload}
              className="mt-2 block w-full p-2 rounded-md bg-neutral-800 outline-none text-white border border-gray-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            />
            <motion.p 
              className="mt-2 text-sm text-neutral-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Accepted formats: .js, .py, .cpp
            </motion.p>
          </motion.label>
        </motion.section>
      </AnimatePresence>

      <motion.footer 
        variants={itemVariants}
        className="flex justify-between items-center mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleLeave}
          className="bg-neutral-800 hover:bg-gray-600 text-white py-2 px-6 rounded-md transition-all duration-300"
        >
          Leave Contest
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleSubmit}
          className="bg-[#ff0059] hover:bg-red-500 text-white py-2 px-6 rounded-md transition-all duration-300"
        >
          Submit Code
        </motion.button>
      </motion.footer>

      <ToastContainer />
    </motion.div>
  );
};

// Component for problem detail display
const ProblemDetail = ({ title, content }) => (
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-[#ff0059]">{title}</h3>
    <p className="text-neutral-400">{content}</p>
  </div>
);

export default CodeRun;
