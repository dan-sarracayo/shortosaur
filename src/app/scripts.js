console.log("shortosaur is awake");

const form = document.getElementById("url-form");
const input = document.getElementById("url-input");
const error = document.getElementById("url-error");
const result = document.getElementById("result");
const resultColorBlock = document.getElementById("color-block");
const resultShortlink = document.getElementById("shortlink");
const resultdestination = document.getElementById("destination");
const copyButton = document.getElementById("copy-button");
const copyLink = document.getElementById("copy-link");
const go = document.getElementById("url-go");

const validUrlRegex =
  /^(https?:\/\/)?([a-zA-Z0-9\-\.]+)(:[0-9]{1,5})?(\/[^\s]*)?$/;

const doShortening = async (url) => {
  const resp = await fetch("/shorten", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ url }),
  });
  const body = await resp.json();
  return { status: resp.status, body };
};

const lsid = "shortosaur"; // localstorage key.

const saveResponse = (response) => {
  const historyArrayString = window.localStorage.getItem(lsid) || "[]";
  const historyArray = JSON.parse(historyArrayString);
  historyArray.push(response);
  window.localStorage.setItem(lsid, JSON.stringify(historyArray));
};

const clearHistory = () => {
  window.localStorage.setItem(lsid, "[]");
};

/**
 * Validator.
 */
(() => {
  input.addEventListener("keyup", (e) => {
    const value = e.target.value;

    if (value !== "" && !value?.match(validUrlRegex)?.length) {
      error.innerHTML =
        "The url entered needs to be a url like this: http(s)://(subdomain.)domain.tld/";
      error.classList.add("active");
      go.setAttribute("disabled", "disabled");
    } else {
      error.innerHTML = "";
      error.classList.remove("active");
      go.removeAttribute("disabled");
    }
  });
})();

const link = (url) =>
  `<a href="${url}" target="_blank">${url
    .replace(/https?:\/\/(.*)\/?$/g, "$1")
    .replace(/\/$/, "")}</a>`;

const stringToHexColor = (url) => {
  // Create a hash from the URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert the hash to a hex color code
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff; // Get the last 8 bits
    color += ("00" + value.toString(16)).slice(-2); // Convert to hex and pad with zeros
  }

  return color;
};

const copyToClipboard = () => {
  // Copy the text inside the text field
  const copyText = document
    .getElementById("shortlink")
    .getElementsByTagName("a")[0];

  // Select the text field
  // copyText.select();
  // copyText.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.href);

  copyButton.innerHTML = "Copied";
  setTimeout(() => {
    copyButton.innerHTML = "Copy";
  }, 1000);
};

/**
 * Form handler.
 */
(() => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputUrl = input.value;
    const response = await doShortening(inputUrl);

    if (response.status !== 200) {
      console.error(response);
      error.innerHTML = "Something went wrong creating your shortlink.";
      error.classList.add("active");
    } else {
      saveResponse(response.body);
      input.value = "";

      error.classList.remove("active");
      error.innerHTML = "";

      resultColorBlock.style.borderColor = stringToHexColor(
        response.body.redirect
      );
      copyLink.value = response.body.redirect;
      resultShortlink.innerHTML = link(response.body.redirect);
      resultdestination.innerHTML = link(response.body.endpoint);
      result.classList.add("active");
    }
  });
})();

/**
 * Init
 */
(() => {
  const history = window.localStorage.getItem(lsid);
  const historyArray = JSON.parse(history || "[]");

  const lastLink = historyArray.sort(({ time: a }, { time: z }) => z - a)[0];
  if (lastLink) {
    resultColorBlock.style.borderColor = stringToHexColor(lastLink.redirect);
    copyLink.value = lastLink.redirect;
    resultShortlink.innerHTML = link(lastLink.redirect);
    resultdestination.innerHTML = link(lastLink.endpoint);
    result.classList.add("active");
  }
})();
