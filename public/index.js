let transactions = [];
let myChart;
let db;
// let saveInMongoDB = true;


fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

function sendTransaction(isAdding) {
  console.log("sendTransaction status: " + isAdding);
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    console.log("fetch failed, so we will save in indexedDB");
    console.log(err);
    // fetch failed, so save in indexed db
    saveRecord(transaction);

    // clear form
    nameEl.value = "";
    amountEl.value = "";
  });
}

document.querySelector("#add-btn").onclick = function() {
  console.log("add button");
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  console.log("subtract button");
  sendTransaction(false);
};

function saveRecord(transaction) {
  console.log("saveRecord here");
  console.log(transaction);

  let name = transaction.name;
  let value = transaction.value;

  const request = window.indexedDB.open("offlineDatabase", 1);
  
  // This returns a result that we can then manipulate.
  request.onsuccess = event => {
    console.log(request.result);
  };

  request.onupgradeneeded = ({ target }) => {
    db = target.result;
    console.log("db = ");
    console.log(db);
    const objectStore = db.createObjectStore("transactionList", {keyPath: "transID", autoIncrement: true});
    objectStore.createIndex("transIndex", "trans");


  };

  request.onsuccess = () => {
    db = request.result;
    const transaction = db.transaction(["transactionList"], "readwrite");
    const transactionStore = transaction.objectStore("transactionList");
    // const transIndex = transactionStore.index("transIndex");

    console.log("name = " + name);
    console.log("value = " + value);

    // Adds data to our objectStore
    transactionStore.add({ "name": name, "value": value });
  }

}

// listen for app coming back online
window.addEventListener("online", updateDatabase);

function updateDatabase() {
  console.log("coming online, updating the MongoDB");

  //const request = window.indexedDB.open("offlineDatabase", 1);
  //console.log("request: ");
  //console.log(request);

  // open a transaction on your pending db
  const transaction = db.transaction(["transactionList"], "readwrite");
  // access your pending object store
  const transactionStore = transaction.objectStore("transactionList");
  // get all records from store and set to a variable
  const getAll = transactionStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      console.log("length = " + getAll.result.length);
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction on your pending db
        const transaction = db.transaction(["transactionList"], "readwrite");

        // access your pending object store
        const transactionStore = transaction.objectStore("transactionList");

        // clear all items in your store
        transactionStore.clear();
      });
    }
  };



}