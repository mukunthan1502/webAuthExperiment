import React, { useEffect, useState } from "react";

import axios from "axios";
axios.defaults.withCredentials = true;

function LoginPage() {
  const [accessToken, setAccessToken] = useState(null);
  const [accessExpiry, setAccessExpiry] = useState(0);
  const [refreshExpiry, setRefreshExpiry] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /*
  const [tokenCountDown, setTokenCountDown] = useState(0);
  const [refreshCountDown, setRefreshCountDown] = useState(0);
  let tokenIntervaal,
    refreshInterval = null;
 */
  useEffect(() => {
    try {
      refreshToken();
    } catch (err) {
      console.log("No Active Login");
    }
  }, []);

  const login = async () => {
    try {
      const response = await axios.post("http://localhost:5001/login", {});
      const { accessToken, tokenDuration, refreshDuration } =
        response.data ?? {};
      setAccessToken(accessToken);
      setIsLoggedIn(true);
      setAccessExpiry(tokenDuration);
      setRefreshExpiry(refreshDuration);
      /*
      setTokenCountDown(response.data.tokenDuration);
      tokenIntervaal && clearInterval(tokenIntervaal);
      tokenIntervaal = setInterval(() => {
        setTokenCountDown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      if (tokenCountDown <= 0) {
        clearInterval(tokenIntervaal);
      }
      setRefreshCountDown(response.data.refreshDuration);
      refreshInterval && clearInterval(refreshInterval);
      refreshInterval = setInterval(() => {
        setRefreshCountDown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      if (tokenCountDown <= 0) {
        clearInterval(refreshInterval);
      }
      */
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const refreshToken = async () => {
    const csrfToken = !document.cookie
      ? null
      : document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrfToken"))
          .split("=")[1];

    console.log("refrshToken:::csrfToken", csrfToken);

    // if (!csrfToken) return;

    try {
      const response = await axios.post(
        "http://localhost:5001/refresh",
        {},
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );
      const { accessToken, tokenDuration, refreshDuration } =
        response.data ?? {};
      setAccessToken(accessToken);
      setAccessExpiry(tokenDuration);
      setRefreshExpiry(refreshDuration);
      setIsLoggedIn(true);
      // alert("Fetched New JWT Access Key");
      /*
      setTokenCountDown(response.data.tokenDuration);
      */
    } catch (error) {
      console.error("Error during token refresh:", error);
      logOutUser();
    }
  };

  const protectedApiCall = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5001/sampleApi",
        {},
        {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        }
      );
    } catch (err) {
      const errStatusMsg =
        err.response.data?.statusMsg?.name ??
        err.response.data?.statusMsg ??
        null;
      if (errStatusMsg === "TokenExpiredError") refreshToken();
      else console.error("protectedApiCall:::err", err);
    }
  };

  const logOutUser = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5001/logout",
        {},
        {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        }
      );
      setAccessToken(null);
      setIsLoggedIn(false);
      setAccessExpiry(0);
      setRefreshExpiry(0);
    } catch (err) {
      console.error("protectedApiCall:::err", err);
    }
  };

  return (
    <div className="App">
      <button onClick={login}>Login</button>
      {/* <button onClick={refreshToken}>Refresh Token</button> */}
      <button onClick={protectedApiCall}>Make Protected API Call</button>
      <button onClick={logOutUser}>Logout</button>
      <p>Access Token: {accessToken}</p>
      <h1>{isLoggedIn ? "User is logged in" : "User NOT logged in "}</h1>
      {!!accessExpiry && <p>JWT Access Token Duration: {accessExpiry}</p>}
      {!!refreshExpiry && <p>JWT Access Token Duration: {refreshExpiry}</p>}
      {/* <h2>Token Time Remaining = {tokenCountDown}</h2>
      <h2>Refresh Time Remaining = {refreshCountDown}</h2> */}
    </div>
  );
}

export default LoginPage;
