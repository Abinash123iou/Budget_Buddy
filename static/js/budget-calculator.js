class BudgetCalculator {
    constructor() {
        this.budget = 0;
        this.expenses = [];
        this.categories = {};
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
        this.setDefaultDateTime();
    }

    bindEvents() {
        // Set budget button
        document.getElementById('setBudgetBtn').addEventListener('click', () => {
            this.setBudget();
        });

        // Add expense button
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.addExpense();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Enter key handlers
        document.getElementById('initialBudget').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setBudget();
        });

        document.getElementById('expenseAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });

        document.getElementById('expenseDescription').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });

        document.getElementById('expenseDateTime').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });
    }

    setBudget() {
        const budgetInput = document.getElementById('initialBudget');
        const amount = parseFloat(budgetInput.value);

        if (!amount || amount <= 0) {
            this.showAlert('Please enter a valid budget amount', 'warning');
            return;
        }

        this.budget = amount;
        this.saveData();
        this.updateDisplay();
        
        // Show expense form and other sections
        document.getElementById('budgetOverview').style.display = 'block';
        document.getElementById('expenseForm').style.display = 'block';
        document.getElementById('expenseHistory').style.display = 'block';
        document.getElementById('categorySummary').style.display = 'block';

        budgetInput.value = '';
        this.showAlert('Budget set successfully!', 'success');
    }

    addExpense() {
        const amountInput = document.getElementById('expenseAmount');
        const categorySelect = document.getElementById('expenseCategory');
        const descriptionInput = document.getElementById('expenseDescription');
        const dateTimeInput = document.getElementById('expenseDateTime');

        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        const description = descriptionInput.value.trim();
        const dateTime = dateTimeInput.value;

        // Validation
        if (!amount || amount <= 0) {
            this.showAlert('Please enter a valid expense amount', 'warning');
            return;
        }

        if (!category) {
            this.showAlert('Please select a category', 'warning');
            return;
        }

        if (!description) {
            this.showAlert('Please enter a description', 'warning');
            return;
        }

        if (!dateTime) {
            this.showAlert('Please select a date and time', 'warning');
            return;
        }

        const remainingBalance = this.getRemainingBalance();
        
        // Check if expense exceeds remaining budget
        if (amount > remainingBalance) {
            this.showInsufficientFundsToast();
            return;
        }

        // Create expense object
        const expense = {
            id: Date.now(),
            amount: amount,
            category: category,
            description: description,
            date: new Date(dateTime).toISOString(),
            balanceAfter: remainingBalance - amount
        };

        this.expenses.push(expense);
        this.updateCategoryTotal(category, amount);
        this.saveData();
        this.updateDisplay();

        // Clear form
        amountInput.value = '';
        categorySelect.value = '';
        descriptionInput.value = '';
        this.setDefaultDateTime();

        this.showAlert('Expense added successfully!', 'success');
    }

    deleteExpense(expenseId) {
        const expenseIndex = this.expenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex === -1) return;

        const expense = this.expenses[expenseIndex];
        
        // Update category total
        this.updateCategoryTotal(expense.category, -expense.amount);
        
        // Remove expense
        this.expenses.splice(expenseIndex, 1);
        
        // Recalculate balance after for remaining expenses
        let runningBalance = this.budget;
        this.expenses.forEach(exp => {
            runningBalance -= exp.amount;
            exp.balanceAfter = runningBalance;
        });

        this.saveData();
        this.updateDisplay();
        this.showAlert('Expense deleted successfully!', 'info');
    }

    updateCategoryTotal(category, amount) {
        if (!this.categories[category]) {
            this.categories[category] = 0;
        }
        this.categories[category] += amount;
        
        // Remove category if total becomes 0
        if (this.categories[category] <= 0) {
            delete this.categories[category];
        }
    }

    getTotalExpenses() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    getRemainingBalance() {
        return this.budget - this.getTotalExpenses();
    }

    updateDisplay() {
        if (this.budget > 0) {
            // Update budget overview
            document.getElementById('initialBudgetDisplay').textContent = this.formatCurrency(this.budget);
            document.getElementById('totalExpensesDisplay').textContent = this.formatCurrency(this.getTotalExpenses());
            
            const remainingBalance = this.getRemainingBalance();
            const remainingElement = document.getElementById('remainingBalanceDisplay');
            remainingElement.textContent = this.formatCurrency(remainingBalance);
            
            // Change color based on remaining balance
            const parentCard = remainingElement.closest('.card');
            parentCard.className = remainingBalance >= 0 ? 
                'card bg-success bg-opacity-10 border-success' : 
                'card bg-danger bg-opacity-10 border-danger';
            remainingElement.className = remainingBalance >= 0 ? 'text-success' : 'text-danger';

            this.updateExpenseHistory();
            this.updateCategoryBreakdown();
        }
    }

    updateExpenseHistory() {
        const tbody = document.getElementById('expenseTableBody');
        tbody.innerHTML = '';

        if (this.expenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No expenses recorded yet
                    </td>
                </tr>
            `;
            return;
        }

        // Sort expenses by date (newest first)
        const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <small class="text-muted editable-date" data-expense-id="${expense.id}" style="cursor: pointer;">
                        ${this.formatDateTime(expense.date)}
                    </small>
                </td>
                <td>
                    <span class="badge bg-secondary">${expense.category}</span>
                </td>
                <td>${expense.description}</td>
                <td class="text-danger fw-bold">-${this.formatCurrency(expense.amount)}</td>
                <td class="fw-bold ${expense.balanceAfter >= 0 ? 'text-success' : 'text-danger'}">
                    ${this.formatCurrency(expense.balanceAfter)}
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="budgetCalculator.editExpenseDateTime(${expense.id})" title="Edit Date & Time">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="budgetCalculator.deleteExpense(${expense.id})" title="Delete Expense">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateCategoryBreakdown() {
        const container = document.getElementById('categoryBreakdown');
        container.innerHTML = '';

        if (Object.keys(this.categories).length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-chart-pie fa-2x mb-2"></i><br>
                    No expenses by category yet
                </div>
            `;
            return;
        }

        const totalExpenses = this.getTotalExpenses();
        
        // Sort categories by amount (highest first)
        const sortedCategories = Object.entries(this.categories)
            .sort(([,a], [,b]) => b - a);

        sortedCategories.forEach(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-3';
            categoryDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-medium">${category}</span>
                    <span class="text-muted">${this.formatCurrency(amount)} (${percentage}%)</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${percentage}%"></div>
                </div>
            `;
            container.appendChild(categoryDiv);
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    showInsufficientFundsToast() {
        const toast = new bootstrap.Toast(document.getElementById('insufficientFundsToast'));
        toast.show();
    }

    exportData() {
        if (this.expenses.length === 0) {
            this.showAlert('No expenses to export', 'warning');
            return;
        }

        let csvContent = 'Date,Category,Description,Amount,Balance After\n';
        
        this.expenses.forEach(expense => {
            csvContent += `"${this.formatDateTime(expense.date)}","${expense.category}","${expense.description}","${expense.amount}","${expense.balanceAfter}"\n`;
        });

        // Add summary
        csvContent += '\nSummary\n';
        csvContent += `Initial Budget,${this.budget}\n`;
        csvContent += `Total Expenses,${this.getTotalExpenses()}\n`;
        csvContent += `Remaining Balance,${this.getRemainingBalance()}\n`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showAlert('Budget report exported successfully!', 'success');
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all budget data? This action cannot be undone.')) {
            this.budget = 0;
            this.expenses = [];
            this.categories = {};
            localStorage.removeItem('budgetCalculatorData');
            
            // Hide sections
            document.getElementById('budgetOverview').style.display = 'none';
            document.getElementById('expenseForm').style.display = 'none';
            document.getElementById('expenseHistory').style.display = 'none';
            document.getElementById('categorySummary').style.display = 'none';

            this.showAlert('All data cleared successfully!', 'info');
        }
    }

    saveData() {
        const data = {
            budget: this.budget,
            expenses: this.expenses,
            categories: this.categories
        };
        localStorage.setItem('budgetCalculatorData', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('budgetCalculatorData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.budget = data.budget || 0;
            this.expenses = data.expenses || [];
            this.categories = data.categories || {};

            if (this.budget > 0) {
                document.getElementById('budgetOverview').style.display = 'block';
                document.getElementById('expenseForm').style.display = 'block';
                document.getElementById('expenseHistory').style.display = 'block';
                document.getElementById('categorySummary').style.display = 'block';
            }
        }
    }

    setDefaultDateTime() {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        const formattedDateTime = localDateTime.toISOString().slice(0, 16);
        document.getElementById('expenseDateTime').value = formattedDateTime;
    }

    editExpenseDateTime(expenseId) {
        const expense = this.expenses.find(exp => exp.id === expenseId);
        if (!expense) return;

        // Create a modal-like prompt using SweetAlert-style confirmation
        const currentDate = new Date(expense.date);
        const localDateTime = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000));
        const formattedDateTime = localDateTime.toISOString().slice(0, 16);

        // Create a temporary input element for date/time selection
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
            <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-edit me-2"></i>Edit Date & Time
                            </h5>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Current: ${this.formatDateTime(expense.date)}</label>
                                <input type="datetime-local" class="form-control" id="editDateTime" value="${formattedDateTime}">
                            </div>
                            <div class="text-muted small">
                                <strong>Expense:</strong> ${expense.description} - ${this.formatCurrency(expense.amount)}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="budgetCalculator.closeEditModal()">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="budgetCalculator.saveEditedDateTime(${expenseId})">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(tempDiv);
        this.currentEditModal = tempDiv;
        
        // Focus on the input
        setTimeout(() => {
            document.getElementById('editDateTime').focus();
        }, 100);

        // Handle Enter key
        document.getElementById('editDateTime').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEditedDateTime(expenseId);
        });
    }

    saveEditedDateTime(expenseId) {
        const newDateTime = document.getElementById('editDateTime').value;
        
        if (!newDateTime) {
            this.showAlert('Please select a valid date and time', 'warning');
            return;
        }

        const expense = this.expenses.find(exp => exp.id === expenseId);
        if (!expense) return;

        expense.date = new Date(newDateTime).toISOString();
        
        this.saveData();
        this.updateDisplay();
        this.closeEditModal();
        
        this.showAlert('Date & time updated successfully!', 'success');
    }

    closeEditModal() {
        if (this.currentEditModal) {
            this.currentEditModal.remove();
            this.currentEditModal = null;
        }
    }
}

// Initialize the budget calculator when the page loads
let budgetCalculator;
document.addEventListener('DOMContentLoaded', () => {
    budgetCalculator = new BudgetCalculator();
});
