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

// ✅ Function to load inventory from Supabase
async function loadItems() {
    let searchQuery = document.getElementById("search")?.value.trim();
    let selectedWing = document.getElementById("wingFilter")?.value; // ✅ Get selected wing filter

    let query = supabase.from("inventory").select("id, code, desc, maxqty, physical, diff, wing"); // ✅ Explicitly selecting "wing" field

    if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,desc.ilike.%${searchQuery}%`);
    }

    if (selectedWing && selectedWing !== "") {
        query = query.eq("wing", selectedWing); // ✅ Filter by selected wing
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
            <td>${item.wing || "N/A"}</td> <!-- ✅ Ensured Wing is displayed -->
            <td>
                <button onclick="editItem(${item.id}, '${item.code}', '${item.desc}', ${item.maxqty}, ${item.physical}, '${item.wing}')">Edit</button>
                <button onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ✅ Function to update the "Physical" quantity in Supabase when edited
async function updatePhysical(id, newPhysical, maxqty) {
    let physical = parseInt(newPhysical);
    if (isNaN(physical) || physical < 0) {
        alert("Invalid quantity. Please enter a valid number.");
        return;
    }

    let diff = maxqty - physical;

    let { error } = await supabase.from("inventory").update({ physical, diff }).eq("id", id);
    if (error) {
        console.error("Error updating physical quantity:", error);
        return;
    }

    // ✅ Update "Difference" column dynamically without reloading
    document.getElementById(`diff-${id}`).textContent = diff;
}

// ✅ Function to add or update an inventory item
async function addItem() {
    let id = document.getElementById("item_id").value;
    let code = document.getElementById("code").value;
    let desc = document.getElementById("desc").value;
    let maxqty = parseInt(document.getElementById("maxqty").value);
    let physical = parseInt(document.getElementById("physical").value);
    let wing = document.getElementById("wing").value; // ✅ Get Wing value

    if (!code || !desc || isNaN(maxqty) || isNaN(physical)) {
        alert("Please fill in all fields!");
        return;
    }

    let data = { code, desc, maxqty, physical, diff: maxqty - physical, wing }; // ✅ Include Wing in data

    if (id) {
        let { error } = await supabase.from("inventory").update(data).eq("id", id);
        if (error) {
            console.error("Error updating item:", error);
            return;
        }
    } else {
        let { error } = await supabase.from("inventory").insert([data]);
        if (error) {
            console.error("Error adding item:", error);
            return;
        }
    }

    clearForm();
    loadItems();
}

// ✅ Function to edit an item (populate form)
function editItem(id, code, desc, maxqty, physical, wing) {
    document.getElementById("item_id").value = id;
    document.getElementById("code").value = code;
    document.getElementById("desc").value = desc;
    document.getElementById("maxqty").value = maxqty;
    document.getElementById("physical").value = physical;
    document.getElementById("wing").value = wing || "Adult ICU"; // ✅ Populate Wing field
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

// ✅ Function to clear the form
function clearForm() {
    document.getElementById("item_id").value = "";
    document.getElementById("code").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("maxqty").value = "";
    document.getElementById("physical").value = "";
    document.getElementById("wing").value = "Adult ICU"; // ✅ Reset Wing dropdown
}

// ✅ Load inventory on page load
loadItems();
