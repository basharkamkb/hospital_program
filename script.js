// ✅ Ensure Supabase is correctly initialized
const { createClient } = window.supabase;

// ✅ Replace with your Supabase credentials
const SUPABASE_URL = "https://yibgrmhiyinczxtcrukm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmdybWhpeWluY3p4dGNydWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMjY5MzAsImV4cCI6MjA1NDgwMjkzMH0.dVek6-wYjCP-8C9PttNqdcDtQROLIR0-RyjMenIa1n4";

// ✅ Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ✅ Load items after the page fully loads
document.addEventListener("DOMContentLoaded", async () => {
    await loadItems();
});


// ✅ Function to load inventory from Supabase and filter by search & wing
async function loadItems() {
    let searchQuery = document.getElementById("search")?.value.trim();
    let selectedWing = document.getElementById("wingFilter")?.value; // ✅ Get selected wing filter

    let query = supabase.from("inventory").select("id, code, desc, maxqty, physical, diff, wing");

    // ✅ Filter by search query
    if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,desc.ilike.%${searchQuery}%`);
    }

    // ✅ Filter by selected wing
    if (selectedWing && selectedWing !== "") {
        query = query.eq("wing", selectedWing);
    }

    let { data, error } = await query;
    if (error) {
        console.error("Error fetching inventory:", error);
        return;
    }

    let tbody = document.getElementById("inventory-list");
    tbody.innerHTML = ""; // Clear table

    data.forEach(item => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.id}</td> 
            <td>${item.code}</td>
            <td>${item.desc}</td>
            <td>${item.maxqty}</td>
            <td>
                <input type="number" value="${item.physical}" 
                    onchange="updatePhysical(${item.id}, this.value, ${item.maxqty})">
            </td>
            <td id="diff-${item.id}">${item.diff}</td>
            <td>${item.wing || "N/A"}</td> 
            <td>
                <button onclick="editItem(${item.id}, '${item.code}', '${item.desc}', ${item.maxqty}, ${item.physical}, '${item.wing}')">Edit</button>
                <button onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ✅ Function to update the "Physical" quantity and recalculate "Difference"
async function updatePhysical(id, newPhysical, maxqty) {
    let physical = parseInt(newPhysical);
    if (isNaN(physical) || physical < 0) {
        alert("Invalid quantity. Please enter a valid number.");
        return;
    }

    let diff = maxqty - physical;

    let { data, error } = await supabase.from("inventory").select("*").eq("id", id).single();
    if (error) {
        console.error("Error fetching item before update:", error);
        return;
    }

    let updatedData = {
        code: data.code,
        desc: data.desc,
        maxqty: data.maxqty,
        physical: physical,
        diff: diff,
        wing: data.wing
    };

    let { error: updateError } = await supabase.from("inventory").update(updatedData).eq("id", id);
    if (updateError) {
        console.error("Error updating physical quantity:", updateError);
        return;
    }

    document.getElementById(`diff-${id}`).textContent = diff;
}

// ✅ Function to add or update an inventory item
async function addItem() {
    let id = document.getElementById("item_id").value;
    let code = document.getElementById("code").value.trim();
    let desc = document.getElementById("desc").value.trim();
    let maxqty = parseInt(document.getElementById("maxqty").value);
    let wing = document.getElementById("wing").value;

    let physical, icu1 = 0, icu2 = 0;

    if (wing === "Adult ICU") {
        icu1 = parseInt(document.getElementById("icu1").value) || 0;
        icu2 = parseInt(document.getElementById("icu2").value) || 0;
        physical = icu1 + icu2; // ✅ Total ICU physical
    } else {
        physical = parseInt(document.getElementById("physical").value);
    }

    if (!code || !desc || isNaN(maxqty) || isNaN(physical)) {
        alert("Please fill in all fields!");
        return;
    }

    let diff = maxqty - physical; // ✅ Difference calculation

    let data = { code, desc, maxqty, physical, diff, wing, icu1, icu2 }; // ✅ Include ICU data

    try {
        if (id) {
            let { error } = await supabase.from("inventory").update(data).eq("id", id);
            if (error) throw error;
        } else {
            let { error } = await supabase.from("inventory").insert([data]);
            if (error) throw error;
        }

        clearForm();
        loadItems();
    } catch (error) {
        console.error("Error saving item:", error);
        alert("Error saving item. Please check the console for details.");
    }
}

// ✅ Function to edit an item (populate form)
function editItem(id, code, desc, maxqty, physical, wing) {
    document.getElementById("item_id").value = id;
    document.getElementById("code").value = code;
    document.getElementById("desc").value = desc;
    document.getElementById("maxqty").value = maxqty;
    document.getElementById("physical").value = physical;

    let wingDropdown = document.getElementById("wing");
    if (wingDropdown) {
        wingDropdown.value = wing || "Adult ICU";
    } else {
        console.error("Wing dropdown not found in the HTML.");
    }
}

// ✅ Function to delete an item
async function deleteItem(id) {
    let { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) {
        console.error("Error deleting item:", error);
        return;
    }
    loadItems();
}
function toggleICUFields() {
    let wing = document.getElementById("wing").value;
    let icuFields = document.getElementById("icu-fields");
    let physicalField = document.getElementById("physical");

    if (wing === "Adult ICU") {
        icuFields.style.display = "block"; // Show ICU fields
        physicalField.disabled = true; // Disable main physical field
    } else {
        icuFields.style.display = "none"; // Hide ICU fields
        physicalField.disabled = false; // Enable main physical field
    }
}

// ✅ Function to clear the form
function clearForm() {
    document.getElementById("item_id").value = "";
    document.getElementById("code").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("maxqty").value = "";
    document.getElementById("physical").value = "";
    document.getElementById("wing").value = "Adult ICU";
}

// ✅ Load inventory on page load
loadItems();
