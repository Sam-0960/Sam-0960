// Smart Timetable Application
class TimetableApp {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'week';
        this.events = this.loadEvents();
        this.editingEvent = null;
        
        this.init();
    }

    init() {
        this.initializeTimeSlots();
        this.initializeDaysGrid();
        this.updateCurrentPeriod();
        this.renderEvents();
        this.bindEvents();
        this.updateTodayHighlight();
    }

    // Initialize time slots (6 AM - 11 PM)
    initializeTimeSlots() {
        const timeSlotsContainer = document.querySelector('.time-slots');
        timeSlotsContainer.innerHTML = '';

        for (let hour = 6; hour <= 23; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = this.formatHour(hour);
            timeSlotsContainer.appendChild(timeSlot);
        }
    }

    // Initialize days grid
    initializeDaysGrid() {
        const daysGrid = document.querySelector('.days-grid');
        daysGrid.innerHTML = '';

        for (let i = 0; i < 7; i++) {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.day = this.getDayName(i);
            
            // Add hour lines
            for (let hour = 6; hour <= 23; hour++) {
                const hourLine = document.createElement('div');
                hourLine.className = 'hour-line';
                hourLine.style.top = `${(hour - 6) * 60}px`;
                dayColumn.appendChild(hourLine);
            }
            
            daysGrid.appendChild(dayColumn);
        }
    }

    // Bind event listeners
    bindEvents() {
        // Navigation buttons
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // View switching
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Add event button
        document.getElementById('addEventBtn').addEventListener('click', () => this.openEventModal());

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeEventModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeEventModal());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteEvent());
        document.getElementById('eventForm').addEventListener('submit', (e) => this.saveEvent(e));

        // Close modal on overlay click
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeEventModal();
            }
        });

        // Day header clicks for day view
        document.querySelectorAll('.day-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const day = e.currentTarget.dataset.day;
                this.selectDay(day);
            });
        });

        // Double click on day columns to add event
        document.querySelectorAll('.day-column').forEach(column => {
            column.addEventListener('dblclick', (e) => {
                const day = column.dataset.day;
                const rect = column.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const hour = Math.floor(y / 60) + 6;
                this.openEventModal(day, hour);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEventModal();
            } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.openEventModal();
            }
        });
    }

    // Navigate weeks
    navigateWeek(direction) {
        this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        this.updateCurrentPeriod();
        this.updateDayHeaders();
        this.renderEvents();
        this.updateTodayHighlight();
    }

    // Go to today
    goToToday() {
        this.currentDate = new Date();
        this.updateCurrentPeriod();
        this.updateDayHeaders();
        this.renderEvents();
        this.updateTodayHighlight();
    }

    // Switch between week and day views
    switchView(view) {
        this.currentView = view;
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update view containers
        document.querySelectorAll('.timetable-view').forEach(container => {
            container.classList.toggle('active', container.id === `${view}View`);
        });

        if (view === 'day') {
            this.renderDayView();
        }
    }

    // Update current period display
    updateCurrentPeriod() {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const periodText = `Week of ${this.formatDate(startOfWeek)} - ${this.formatDate(endOfWeek)}`;
        document.getElementById('currentPeriod').textContent = periodText;
    }

    // Update day headers with correct dates
    updateDayHeaders() {
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);

        document.querySelectorAll('.day-header').forEach((header, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            
            const dateSpan = header.querySelector('.day-date');
            dateSpan.textContent = date.getDate();
        });
    }

    // Update today highlight
    updateTodayHighlight() {
        const today = new Date();
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);

        document.querySelectorAll('.day-header').forEach((header, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            
            const isToday = date.toDateString() === today.toDateString();
            header.classList.toggle('today', isToday);
        });
    }

    // Open event modal
    openEventModal(day = null, hour = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const deleteBtn = document.getElementById('deleteBtn');
        
        // Reset form
        form.reset();
        deleteBtn.style.display = 'none';
        this.editingEvent = null;

        // Set default values if provided
        if (day) {
            document.getElementById('eventDay').value = day;
        }
        if (hour) {
            document.getElementById('startTime').value = `${hour.toString().padStart(2, '0')}:00`;
            document.getElementById('endTime').value = `${(hour + 1).toString().padStart(2, '0')}:00`;
        }

        // Set default date to current week
        const date = new Date(this.currentDate);
        document.getElementById('eventDate').value = date.toISOString().split('T')[0];

        document.getElementById('modalTitle').textContent = 'Add New Event';
        modal.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    // Close event modal
    closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('active');
        this.editingEvent = null;
    }

    // Save event
    saveEvent(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = {
            id: this.editingEvent ? this.editingEvent.id : Date.now(),
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            day: formData.get('day'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            category: formData.get('category')
        };

        // Validate times
        if (eventData.startTime >= eventData.endTime) {
            alert('End time must be after start time');
            return;
        }

        if (this.editingEvent) {
            // Update existing event
            const index = this.events.findIndex(event => event.id === this.editingEvent.id);
            this.events[index] = eventData;
        } else {
            // Add new event
            this.events.push(eventData);
        }

        this.saveEvents();
        this.renderEvents();
        this.closeEventModal();
        
        if (this.currentView === 'day') {
            this.renderDayView();
        }
    }

    // Delete event
    deleteEvent() {
        if (this.editingEvent && confirm('Are you sure you want to delete this event?')) {
            this.events = this.events.filter(event => event.id !== this.editingEvent.id);
            this.saveEvents();
            this.renderEvents();
            this.closeEventModal();
            
            if (this.currentView === 'day') {
                this.renderDayView();
            }
        }
    }

    // Edit event
    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.editingEvent = event;
        
        // Populate form
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventDay').value = event.day;
        document.getElementById('startTime').value = event.startTime;
        document.getElementById('endTime').value = event.endTime;
        document.getElementById('eventCategory').value = event.category;

        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('deleteBtn').style.display = 'block';
        document.getElementById('eventModal').classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    // Render events in week view
    renderEvents() {
        // Clear existing events
        document.querySelectorAll('.event').forEach(event => event.remove());

        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);

        this.events.forEach(event => {
            const eventDate = new Date(event.date);
            const dayDiff = Math.floor((eventDate - startOfWeek) / (1000 * 60 * 60 * 24));
            
            if (dayDiff >= 0 && dayDiff < 7) {
                this.renderEvent(event, dayDiff);
            }
        });
    }

    // Render single event
    renderEvent(event, dayIndex) {
        const dayColumn = document.querySelectorAll('.day-column')[dayIndex];
        if (!dayColumn) return;

        const eventElement = document.createElement('div');
        eventElement.className = `event ${event.category}`;
        eventElement.dataset.eventId = event.id;
        
        const startTime = this.parseTime(event.startTime);
        const endTime = this.parseTime(event.endTime);
        const duration = endTime - startTime;
        
        // Position event (6 AM = 0px, each hour = 60px)
        const top = (startTime - 6) * 60;
        const height = duration * 60;
        
        eventElement.style.top = `${top}px`;
        eventElement.style.height = `${height}px`;
        
        eventElement.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-time">${event.startTime} - ${event.endTime}</div>
        `;
        
        eventElement.addEventListener('click', () => this.editEvent(event.id));
        
        dayColumn.appendChild(eventElement);
    }

    // Render day view
    renderDayView() {
        const dayEventsContainer = document.querySelector('.day-events');
        dayEventsContainer.innerHTML = '';

        const today = new Date();
        const todayEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === today.toDateString();
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (todayEvents.length === 0) {
            dayEventsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-calendar-plus" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No events scheduled for today</p>
                    <button class="add-event-btn" onclick="app.openEventModal()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i>
                        Add Your First Event
                    </button>
                </div>
            `;
            return;
        }

        todayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'day-event';
            eventElement.innerHTML = `
                <div class="day-event-time">${event.startTime} - ${event.endTime}</div>
                <div class="day-event-content">
                    <div class="day-event-title">${event.title}</div>
                    ${event.description ? `<div class="day-event-description">${event.description}</div>` : ''}
                </div>
            `;
            
            eventElement.addEventListener('click', () => this.editEvent(event.id));
            dayEventsContainer.appendChild(eventElement);
        });
    }

    // Select specific day
    selectDay(day) {
        this.currentView = 'day';
        this.switchView('day');
        this.renderDayView();
    }

    // Utility functions
    formatHour(hour) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour} ${ampm}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours + minutes / 60;
    }

    getDayName(index) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days[index];
    }

    // Local storage functions
    saveEvents() {
        try {
            localStorage.setItem('timetable-events', JSON.stringify(this.events));
        } catch (error) {
            console.error('Failed to save events:', error);
        }
    }

    loadEvents() {
        try {
            const stored = localStorage.getItem('timetable-events');
            return stored ? JSON.parse(stored) : this.getDefaultEvents();
        } catch (error) {
            console.error('Failed to load events:', error);
            return this.getDefaultEvents();
        }
    }

    // Default sample events
    getDefaultEvents() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        return [
            {
                id: 1,
                title: 'Morning Workout',
                description: 'Gym session - cardio and strength training',
                date: today.toISOString().split('T')[0],
                day: 'monday',
                startTime: '07:00',
                endTime: '08:00',
                category: 'health'
            },
            {
                id: 2,
                title: 'Team Meeting',
                description: 'Weekly project review and planning',
                date: today.toISOString().split('T')[0],
                day: 'monday',
                startTime: '09:00',
                endTime: '10:30',
                category: 'meeting'
            },
            {
                id: 3,
                title: 'Data Structures Study',
                description: 'Practice algorithms and problem solving',
                date: today.toISOString().split('T')[0],
                day: 'monday',
                startTime: '14:00',
                endTime: '16:00',
                category: 'study'
            },
            {
                id: 4,
                title: 'Web Development Project',
                description: 'Work on React components and API integration',
                date: tomorrow.toISOString().split('T')[0],
                day: 'tuesday',
                startTime: '10:00',
                endTime: '12:00',
                category: 'work'
            },
            {
                id: 5,
                title: 'Lunch with Friends',
                description: 'Catch up over lunch at the new cafe',
                date: tomorrow.toISOString().split('T')[0],
                day: 'tuesday',
                startTime: '12:30',
                endTime: '14:00',
                category: 'personal'
            }
        ];
    }

    // Export functionality
    exportTimetable() {
        const dataStr = JSON.stringify(this.events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'timetable-export.json';
        link.click();
    }

    // Import functionality
    importTimetable(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedEvents = JSON.parse(e.target.result);
                if (Array.isArray(importedEvents)) {
                    this.events = importedEvents;
                    this.saveEvents();
                    this.renderEvents();
                    if (this.currentView === 'day') {
                        this.renderDayView();
                    }
                    alert('Timetable imported successfully!');
                } else {
                    alert('Invalid file format');
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimetableApp();
    
    // Add some useful keyboard shortcuts info
    console.log('🗓️ Smart Timetable loaded successfully!');
    console.log('💡 Keyboard shortcuts:');
    console.log('   • Ctrl/Cmd + N: Add new event');
    console.log('   • Escape: Close modal');
    console.log('   • Double-click on time slot: Quick add event');
});

// Service Worker Registration (for potential offline functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(() => console.log('Service Worker registration failed'));
    });
}

// Add theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('dark-theme', document.body.classList.contains('dark-theme'));
}

// Load saved theme
if (localStorage.getItem('dark-theme') === 'true') {
    document.body.classList.add('dark-theme');
}