import { createContext, useContext, useState } from "react";
// create context :- where authenticated data is stored and shared
// useContext :-  Allows another component to access the shared data
// useState:-  Stores changong data

const AuthContext = createContext();

export const AuthProvider = ({ children }) => { // to provide authhentication data to its children 
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  ); // localstorage stores data even after page refresh 
  // if user data is found in local storage, it is parsed from JSON string to JavaScript
  //  object and set as initial state, otherwise null is used as initial state

  const [token, setToken] = useState(localStorage.getItem("token") || null); // sets 
  // initial state of token from local storage, if not found it will be null

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  }; // called after successfull login 


  const updateUser = (newUserData) => {
    const merged = { ...user, ...newUserData };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  }; // used when some info changes , if user updates something in profile, it will update the user data in local storage and state

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        updateUser,
        logout,
        isAuthenticated: !!token && !!user, // does a token exist ? and does a user exist ? if both exist, then user is authenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
