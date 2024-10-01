import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { AI_CHATBOT_URL, MAJOR_CHAT_SERVICE, RUST_BACKEND_URL_SCORE, RUST_MAIN_URL } from "../utils/constant.js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import messageSound from "../assets/message-sent.mp3";

// Create AIChatContext
export const AIChatContext = createContext();

// Provider component
export const AIChatContextProvider = ({ children }) => {
  const audioRef = useRef(new Audio(messageSound));
  const { user } = useContext(AuthContext); // Ensure this is correct in your app
  const [userAIChatID, setUserAIChatID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesError, setMessagesError] = useState(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [mUser, setMUser] = useState(null);
  const [textMessage, setTextMessage] = useState("");
  const [sendTextMessageError, setSendTextMessageError] = useState(null);
  const [score, setScore] = useState(null);
  
  const navigate = useNavigate();

  // Fetch messages when userAIChatID changes
  useEffect(() => {
    const getMessages = async () => {
      if (!userAIChatID) return;

      setIsMessagesLoading(true);
      setMessagesError(null);

      try {
        const response = await axios.get(
          `${MAJOR_CHAT_SERVICE}messages/${userAIChatID}`
        );

        // Update messages state
        setMessages(response.data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessagesError(error);
      } finally {
        setIsMessagesLoading(false);
      }
    };

    getMessages();
  }, [userAIChatID]);

  // Function to send a text message
  const sendTextMessage = useCallback(async (message) => {
    if (!message || !userAIChatID || !mUser) {
      console.log("Cannot send message");
      return;
    }

    try {
      // Send the user's message to the server
      const userMessageResponse = await axios.post(
        `${MAJOR_CHAT_SERVICE}messages`,
        {
          chatId: userAIChatID,
          senderId: mUser._id,
          text: message,
        }
      );

      // Add the user's message to the messages state
      setMessages(prev => [...prev, userMessageResponse.data]);
      audioRef.current.play();

      // Construct the request payload for the AI chat URL
      const aiRequestPayload = {
        user_id: mUser._id, // Replace with actual user ID if needed
        message: message
      };

      // Send the request to the AI chat service
      const aiResponse = await axios.post(AI_CHATBOT_URL, aiRequestPayload);

      // Check if compatibility score exists
      if (aiResponse.data.compatibility !== undefined) {
        try {
          // Update the database
          const response = await axios.put(`${RUST_MAIN_URL}updatescore`, {
            email: user.email,
            score: Math.floor(Number(aiResponse.data.compatibility * 100)),
          });

          // Set the score state
          setScore(aiResponse.data.compatibility);

          if (response.status === 202) {
            toast.success("Score updated successfully", {
              theme: "dark",
              position: "top-right",
              autoClose: 1500,
            });

            // Redirect based on user gender
            if (user?.gender === "Female") {
              navigate("/dashboard");
            } else {
              navigate("/request");
            }
          }
        } catch (error) {
          console.error("Error updating score:", error);
          // Handle error appropriately
        }
      }

      // Store the AI's response as a message in your server
      const aiMessageResponse = await axios.post(
        `${MAJOR_CHAT_SERVICE}/messages`,
        {
          chatId: userAIChatID,
          senderId: "66c5e5a825f42519a77afa5f", // AI Bot ID
          text: aiResponse.data.response, // Use the response text from AI
        }
      );

      // Add the AI's message to the messages state
      setMessages(prev => [...prev, aiMessageResponse.data]);

      // Clear the input field after the message is sent
      setTextMessage("");
    } catch (error) {
      setSendTextMessageError(error.message);
      console.error("Error sending message:", error.message);
    }
  }, [userAIChatID, mUser]);

  // Provider value
  return (
    <AIChatContext.Provider
      value={{
        mUser,
        setMUser,
        userAIChatID,
        setUserAIChatID,
        messages,
        setMessages,
        isMessagesLoading,
        messagesError,
        textMessage,
        setTextMessage,
        sendTextMessage,
        sendTextMessageError,
        score, // Added score to provider value
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};
