#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

struct Order {
    int id;
    int items_count;
    bool is_prepaid;
    double timestamp;
    int priority_score;
};

// Hybrid Queue Logic: Shortest Job First (SJF) + Priority (Prepaid)
int calculate_priority(int items_count, bool is_prepaid) {
    int score = 0;
    
    // SJF (Less items = higher priority)
    if (items_count <= 2) score += 20;
    else if (items_count <= 5) score += 10;
    
    // Prepaid Priority
    if (is_prepaid) score += 15;
    
    return score;
}

extern "C" {
    int get_order_priority(int items, bool prepaid) {
        return calculate_priority(items, prepaid);
    }
}

int main() {
    std::cout << "Gully Eats - Smart Kitchen Algorithm Module Initialized" << std::endl;
    return 0;
}
