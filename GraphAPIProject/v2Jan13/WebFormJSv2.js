let tenantRestrictions;
const tenantId = "your tenant id";

// Fetch the tenant restrictions from the Azure app registration
const tenantRestrictionsUrl = `https://management.azure.com/your-app-registration-id/oauth2PermissionGrants?api-version=1.0`;
fetch(tenantRestrictionsUrl, {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    tenantRestrictions = data.value.map(item => item.clientId);
    // Check if the tenantId matches the tenant restrictions
    if(!tenantRestrictions.includes(tenantId)){
        throw new Error("TenantID does not match the tenant restrictions");
    }
// Add a variable to keep track of the number of requests made
let requestCount = 0;

// Add a function to handle the rate limiting
function handleRateLimiting(response) {
    // Check if the rate limit has been reached
    if (response.status === 429) {
        // Get the retry-after time in seconds
        const retryAfter = response.headers.get("Retry-After");
        // Wait for the specified time before making another request
        setTimeout(() => {
            requestCount = 0;
        }, retryAfter * 1000);
        throw new Error("Rate limit reached, please try again later.");
    }
    return response;
}
})
.catch(error => {
    console.log(error);
    alert("Error: " + error.message);
});

const clientId = "your_client_id";
const redirectUri = "your_redirect_uri";
const scope = "openid User.Read";
const authorizeUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=id_token&redirect_uri=${redirectUri}&scope=${scope}&response_mode=fragment&state=12345`;
const token = sessionStorage.getItem("token");
if(!token){
    // Redirect the user to the authorizeUrl
    window.location.href = authorizeUrl;
}

// Add an event listener to the form to handle the submit event
document.getElementById("create-user-form").addEventListener("submit", function(event) {
  event.preventDefault();
  
  // Validate the form input fields
  if (!validateForm()) {
    return;
  }
  
  // Extract the access token from the URL hash fragment
  var hash = window.location.hash;
  var access_token = hash.substring(hash.indexOf("access_token=") + "access_token=".length, hash.indexOf("&"));
  
  // Use the access token to call the Microsoft Graph API
  var headers = new Headers();
  headers.append("Authorization", "Bearer " + access_token);
  headers.append("Content-Type", "application/json");
  
  var userDetails = {
    accountEnabled: true,
    displayName: document.getElementById("first-name").value + " " + document.getElementById("last-name").value,
    mailNickname: document.getElementById("username").value,
    passwordProfile: {
      password: document.getElementById("password").value,
      forceChangePasswordNextSignIn: true
    },
    userPrincipalName: document.getElementById("username").value + "@babalabs.net",
    usageLocation: "US"
  };
  
  // Call the Microsoft Graph API to create the user
  fetch('https://graph.microsoft.com/v1.0/users', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(userDetails)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Error creating user: " + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    // Check if the user was created successfully
    if (data.id) {
      // Assign a license to the user
      var license = document.getElementById("license").value;
      var skuId = license.split(":")[0];
      var tenantId = license.split(":")[1];
      
      fetch(`https://graph.microsoft.com/v1.0/users/${data.id}/assignLicense`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          addLicenses: [{
            skuId: skuId,
            tenantId: tenantId
          }],
          removeLicenses: []
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Error assigning license: " + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        // Check if the license was assigned successfully
        if (data.value) {
          // License was assigned successfully
          alert("User was created and licensed successfully!");
        } else {
          // Handle error
          alert("Error assigning license: " + data.error.message);
        }
      })
      .catch(error => {
        // Handle error
        console.log(error);
        alert("Error: " + error.message);
      });
    } else {
      // Handle error
      alert("Error creating user: " + data.error.message);
    }
  })
  .catch(error => {
    // Handle error
    console.log(error);
    alert("Error: " + error.message);
  });
});

// Add a function to validate the form input fields
function validateForm() {
    // Get the form input fields
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    // Check if the first-name, last-name, username, and password fields are not empty
    if (!firstName || !lastName || !username || !password) {
      alert("All fields are required");
      return false;
    }
  
    // Check if the username is a valid email address
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(username)) {
      alert("Invalid email address");
      return false;
    }
  
    // Check if the password meets certain complexity requirements
    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}/.test(password)) {
      alert("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
      return false;
    }
  
    // If all validation checks pass, return true
    return true;
  }
