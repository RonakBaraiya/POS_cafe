import psycopg2
from flask import Flask, render_template, jsonify, request, session, redirect
from flask_socketio import SocketIO, emit


kitchen_order = []

app = Flask(__name__)
socketio = SocketIO(app,cors_allowed_origins="*")

app.secret_key = "rbac-secret"

@app.route("/set-role", methods=["POST"])
def set_role():
    role = request.json.get("role")
    if role not in ["counter", "kitchen"]:
        return jsonify({"ok": False}), 400
    session["role"] = role
    return jsonify({"ok": True})

@app.route("/counter")
def counter():
    if session.get("role") != "counter":
        return redirect("/")
    return render_template("counter.html")


@app.route("/kitchen")
def kitchen():
    if session.get("role") != "kitchen":
        return redirect("/")
    return render_template("kitchen.html")




@socketio.on("test")
def test_event(data):
    print("Socket working", data)
    
def db_pilot():
    return psycopg2.connect(
        dbname = "cafe",
        user = "postgres",
        password = "ronak_13",
        host = "localhost",
        port = "5432"
    )

@app.route("/")
def home():
    global current_order
    current_order = {}
    return render_template("auth.html")

current_order = {}
@app.route("/item-clicked", methods=["POST"])
def item_clicked():
    # Get UI data
    data = request.get_json()
    
    item_id = int(data["item_id"])
    requested_qty = int(data["current_qty"])
    
    conn = db_pilot()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT name, price, stock_quantity FROM menu_items WHERE id = %s",
        (item_id,)
    )
    name, price, stock = cur.fetchone()
    cur.close()
    conn.close()
    
    if requested_qty >= stock:
        return jsonify(False)
    
    if requested_qty == 0:
        current_order.pop(item_id, None)
    else:
        current_order[item_id] = {
            "name" : name,
            "price" : float(price),
            "qty" : requested_qty
        }
    return jsonify({
        "allowed" : True,
        "order" : current_order
    })
    
@app.route("/place-order", methods=["POST"])
def place_order():
    global current_order   
    data = request.get_json()
    order = {
        "order_id": data["order_id"],
        "order_items": data["order_html"]
    }
    kitchen_order.append(order)

    # emit to kitchen socket
    socketio.emit("new_order", order)

    current_order = {}    
    return jsonify({"success": True})




@app.route("/api/kitchen-orders")
def get_kitchen_orders():
    return jsonify(kitchen_order)

@app.route("/order-ready", methods=["POST"])
def order_ready():
    data = request.get_json()
    order_id = data.get("order_id")

    # remove the order from kitchen_order
    global kitchen_order
    kitchen_order = [o for o in kitchen_order if o["order_id"] != order_id]

    return jsonify({"success": True})

@socketio.on("order_ready_for_counter")
def notify_counter(data):
    order_id = data.get("order_id")
    # broadcast to all counter clients
    emit("order_ready", {"order_id": order_id}, broadcast=True)


    
if __name__ == "__main__":
    socketio.run(app, debug=True)


