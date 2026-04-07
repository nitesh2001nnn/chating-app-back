import sendOtp from "./config/mailer.js";

async function run() {
  console.log("---- Test 1: undefined ----");
  try {
    await sendOtp(undefined, "Subj", "Text");
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("---- Test 2: null ----");
  try {
    await sendOtp(null, "Subj", "Text");
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("---- Test 3: empty string ----");
  try {
    await sendOtp("", "Subj", "Text");
  } catch (e) {
    console.log("Error:", e.message);
  }

   console.log("---- Test 4: empty array ----");
  try {
    await sendOtp([], "Subj", "Text");
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
