console.log("shortosaur is awake");

const form = document.getElementById("url-form");
const input = document.getElementById("url-input");
const error = document.getElementById("url-error");
const go = document.getElementById("url-go");
const history = document.getElementById("history-list");
const clearBtn = document.getElementById("clear-history");

const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;

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
const paintHistory = () => {
  const historyArrayString = window.localStorage.getItem(lsid) || "[]";
  const historyArray = JSON.parse(historyArrayString);

  if (historyArray < 1) {
    clearBtn.style.display = "none";
  } else {
    clearBtn.style.display = "block";
  }

  let newHistoryList = "";
  if (historyArray?.length) {
    historyArray
      .sort(({ time: timeA }, { time: timeZ }) => timeZ - timeA)
      .filter(({ endpoint: e, redirect: r, time: t }) => e && r && t)
      .forEach((shortening) => {
        const { endpoint, redirect, time } = shortening;
        const pad = (n) => (n < 10 ? "0" + n : n);
        const _time = new Date(time);
        const prettyTime =
          pad(_time.getDate()) +
          "/" +
          pad(_time.getMonth()) +
          "/" +
          pad(_time.getFullYear());

        const link = (url) =>
          `<a href="${url}" target="_blank">${url.replace(
            /https?\:\/\//,
            ""
          )}</a>`;

        newHistoryList += "<tr>";
        newHistoryList += `<td>${link(endpoint)}</td>`;
        newHistoryList += `<td>${link(redirect)}</td>`;
        newHistoryList += `<td>${prettyTime}</td>`;
        newHistoryList += "</tr>";
      });
  } else {
    newHistoryList +=
      "<tr><td colSpan='3' class='empty-text'>Previously shortened links will show here.</tr></tr>";
  }

  history.innerHTML = newHistoryList;
};

const saveResponse = (response) => {
  const historyArrayString = window.localStorage.getItem(lsid) || "[]";
  const historyArray = JSON.parse(historyArrayString);
  historyArray.push(response);
  window.localStorage.setItem(lsid, JSON.stringify(historyArray));
  paintHistory();
};

const clearHistory = () => {
  window.localStorage.setItem(lsid, "[]");
  paintHistory();
};

/**
 * Validator.
 */
(() => {
  input.addEventListener("keyup", (e) => {
    const value = e.target.value;

    if (value !== "" && !value?.match(urlRegex)?.length) {
      error.classList.add("active");
      go.setAttribute("disabled", "disabled");
    } else {
      error.classList.remove("active");
      go.removeAttribute("disabled");
    }
  });
})();

/**
 * Form handler.
 */
(() => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputUrl = input.value;
    const response = await doShortening(inputUrl);

    if (response.status !== 200) {
      alert(response);
    } else {
      saveResponse(response.body);
      input.value = "";
    }
  });
})();

/**
 *
 */
(() => {
  clearBtn.addEventListener("click", (e) => {
    e.preventDefault();
    clearHistory();
  });
})();

/**
 * Init
 */
(() => {
  paintHistory();
})();
