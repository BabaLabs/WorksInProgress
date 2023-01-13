let rateLimit = {};

document.getElementById("create-user-form").addEventListener("submit", function(event) {
  event.preventDefault();

  // Validate the form input fields
  if (!validateForm()) {
    return;
  }

  // Extract the access token from the URL hash fragment
  var hash = window.location.hash;
  var access_token = hash.substring(hash.indexOf("access_token=") + "access_token=".length, hash.indexOf("&"));

  // Check for rate-limiting
  let currentTime = new Date().getTime();
  let ipAddress = "user_ip_address"; // replace with code to get user's IP address
  if (rateLimit[ipAddress] && currentTime - rateLimit[ipAddress] < 60000) {
    alert("Too many requests, please try again later.");
    return;
  }
  rateLimit[ipAddress] = currentTime;

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
alert})})
