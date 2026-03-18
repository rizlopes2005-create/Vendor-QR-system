class Order:
    def __init__(self, id, items_count, is_prepaid, timestamp):
        self.id = id
        self.items_count = items_count
        self.is_prepaid = is_prepaid
        self.timestamp = timestamp
        self.priority_score = calculate_priority(items_count, is_prepaid)


def calculate_priority(items_count, is_prepaid):
    score = 0

    # Shortest Job First logic
    if items_count <= 2:
        score += 20
    elif items_count <= 5:
        score += 10

    # Prepaid priority
    if is_prepaid:
        score += 15

    return score


def get_order_priority(items, prepaid):
    return calculate_priority(items, prepaid)


print("Arun Bites - Smart Kitchen Algorithm Module Initialized")
