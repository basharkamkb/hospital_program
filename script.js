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
    let searchQuery = document.getElementById("search").value.trim();
    let query = supabase.from("inventory").select("*");

    if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,desc.ilike.%${searchQuery}%`);
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
            <td>${item.physical}</td>
            <td>${item.maxqty - item.physical}</td>
            <td>
                <button onclick="editItem(${item.id}, '${item.code}', '${item.desc}', ${item.maxqty}, ${item.physical})">Edit</button>
                <button onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ✅ Function to add or update an inventory item
async function addItem() {
    let id = document.getElementById("item_id").value;
    let code = document.getElementById("code").value;
    let desc = document.getElementById("desc").value;
    let maxqty = parseInt(document.getElementById("maxqty").value);
    let physical = parseInt(document.getElementById("physical").value);

    if (!code || !desc || isNaN(maxqty) || isNaN(physical)) {
        alert("Please fill in all fields!");
        return;
    }

    let data = { code, desc, maxqty, physical, diff: maxqty - physical };

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
function editItem(id, code, desc, maxqty, physical) {
    document.getElementById("item_id").value = id;
    document.getElementById("code").value = code;
    document.getElementById("desc").value = desc;
    document.getElementById("maxqty").value = maxqty;
    document.getElementById("physical").value = physical;
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
}

// ✅ Load inventory on page load
loadItems();
