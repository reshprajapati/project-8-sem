import React, { Component } from 'react';
import './AvailabilityCalendar.css';

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric'
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short'
});

const selectedDayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit'
});

const toDateKey = (date) => {
  const currentDate = new Date(date);
  return [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, '0'),
    String(currentDate.getDate()).padStart(2, '0')
  ].join('-');
};

const fromDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfMonth = (date) => {
  const currentDate = new Date(date);
  return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
};

const sameMonth = (left, right) => {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth();
};

class AvailabilityCalendar extends Component {
  constructor(props) {
    super(props);

    const normalizedSlots = this.normalizeSlots(props.slots || []);
    const slotsByDate = this.groupSlotsByDate(normalizedSlots);
    const firstPackedDate = (props.packedDates || [])[0];

    this.state = {
      normalizedSlots,
      slotsByDate,
      visibleMonth: startOfMonth(normalizedSlots[0] || (firstPackedDate ? fromDateKey(firstPackedDate) : new Date())),
      selectedDateKey: props.selectedSlot ? toDateKey(props.selectedSlot) : (normalizedSlots[0] ? toDateKey(normalizedSlots[0]) : null)
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.slots !== this.props.slots || prevProps.selectedSlot !== this.props.selectedSlot) {
      const normalizedSlots = this.normalizeSlots(this.props.slots || []);
      const slotsByDate = this.groupSlotsByDate(normalizedSlots);

      const nextDateKey = this.props.selectedSlot
        ? toDateKey(this.props.selectedSlot)
        : (this.state.selectedDateKey && slotsByDate[this.state.selectedDateKey]?.length
          ? this.state.selectedDateKey
          : (normalizedSlots[0] ? toDateKey(normalizedSlots[0]) : null));

      let visibleMonth = this.state.visibleMonth;
      if (this.props.selectedSlot) {
        const nextMonth = startOfMonth(this.props.selectedSlot);
        if (!sameMonth(nextMonth, visibleMonth)) {
          visibleMonth = nextMonth;
        }
      }

      this.setState({ normalizedSlots, slotsByDate, visibleMonth, selectedDateKey: nextDateKey });
    }
  }

  normalizeSlots(slots) {
    return [...slots].filter(Boolean).sort((a, b) => new Date(a) - new Date(b));
  }

  groupSlotsByDate(normalizedSlots) {
    return normalizedSlots.reduce((groupedSlots, slot) => {
      const dateKey = toDateKey(slot);
      if (!groupedSlots[dateKey]) groupedSlots[dateKey] = [];
      groupedSlots[dateKey].push(slot);
      return groupedSlots;
    }, {});
  }

  isPackedDay = (dateKey) => {
    return (this.props.packedDates || []).includes(dateKey);
  };

  handleSelectDay = (dateKey) => {
    const { slotsByDate } = this.state;
    const { onSelectSlot, onSelectPackedDay } = this.props;
    const hasSlots = Boolean(slotsByDate[dateKey]?.length);

    // A packed day has no times to pick, but the client may still ask the
    // studio admin to appoint a covering designer for it.
    if (!hasSlots) {
      if (this.isPackedDay(dateKey) && onSelectPackedDay) {
        this.setState({ selectedDateKey: dateKey });
        onSelectPackedDay(dateKey);
      }
      return;
    }

    this.setState({ selectedDateKey: dateKey });

    if (!this.props.selectedSlot && onSelectSlot) {
      onSelectSlot(slotsByDate[dateKey][0]);
    }
  };

  goToPreviousMonth = () => {
    this.setState(({ visibleMonth }) => ({
      visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
    }));
  };

  goToNextMonth = () => {
    this.setState(({ visibleMonth }) => ({
      visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
    }));
  };

  render() {
    const {
      renderSlotActions,
      emptyMessage = 'No available slots yet.',
      selectedSlot,
      packedDates = [],
      onSelectPackedDay
    } = this.props;
    const { normalizedSlots, slotsByDate, visibleMonth, selectedDateKey } = this.state;

    // A fully packed designer has no open slots at all, but the calendar must
    // still render so those packed days can be seen and requested.
    if (!normalizedSlots.length && !packedDates.length) {
      return (
        <div className="availability-calendar empty">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    const selectedDateSlots = selectedDateKey ? (slotsByDate[selectedDateKey] || []) : [];

    const firstDayOfGrid = new Date(visibleMonth);
    firstDayOfGrid.setDate(1 - firstDayOfGrid.getDay());

    const calendarDays = Array.from({ length: 42 }, (_, index) => {
      const currentDate = new Date(firstDayOfGrid);
      currentDate.setDate(firstDayOfGrid.getDate() + index);
      const dateKey = toDateKey(currentDate);
      return {
        date: currentDate,
        dateKey,
        inCurrentMonth: currentDate.getMonth() === visibleMonth.getMonth(),
        slots: slotsByDate[dateKey] || []
      };
    });

    return (
      <div className="availability-calendar">
        <div className="calendar-toolbar">
          <button type="button" className="calendar-nav" onClick={this.goToPreviousMonth}>
            Prev
          </button>
          <h3>{monthFormatter.format(visibleMonth)}</h3>
          <button type="button" className="calendar-nav" onClick={this.goToNextMonth}>
            Next
          </button>
        </div>

        <div className="calendar-weekdays">
          {Array.from({ length: 7 }, (_, index) => {
            const weekday = new Date(2026, 0, 4 + index);
            return (
              <span key={weekday.toISOString()}>
                {weekdayFormatter.format(weekday)}
              </span>
            );
          })}
        </div>

        <div className="calendar-grid">
          {calendarDays.map(day => {
            const isSelectedDay = day.dateKey === selectedDateKey;
            const hasSlots = day.slots.length > 0;
            const isPacked = !hasSlots && packedDates.includes(day.dateKey);
            const isRequestable = isPacked && Boolean(onSelectPackedDay);

            let dayLabel = 'Unavailable';
            if (hasSlots) {
              dayLabel = `${day.slots.length} slot${day.slots.length > 1 ? 's' : ''}`;
            } else if (isPacked) {
              dayLabel = isRequestable ? 'Packed — request' : 'Packed';
            }

            return (
              <button
                key={day.dateKey}
                type="button"
                className={[
                  'calendar-day',
                  day.inCurrentMonth ? '' : 'outside-month',
                  hasSlots ? 'has-slots' : 'no-slots',
                  isPacked ? 'packed' : '',
                  isRequestable ? 'requestable' : '',
                  isSelectedDay ? 'selected' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => this.handleSelectDay(day.dateKey)}
              >
                <span className="day-number">{day.date.getDate()}</span>
                <span className="day-count">{dayLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="calendar-slot-panel">
          <div className="slot-panel-header">
            <h4>
              {selectedDateKey
                ? selectedDayFormatter.format(selectedDateSlots[0] ? new Date(selectedDateSlots[0]) : fromDateKey(selectedDateKey))
                : 'Choose a day'}
            </h4>
            <span>{selectedDateSlots.length} available</span>
          </div>

          {selectedDateSlots.length === 0 && selectedDateKey && packedDates.includes(selectedDateKey) ? (
            <p className="calendar-packed-day">
              This designer is fully booked on this date.
              {onSelectPackedDay
                ? ' Send a request below and the studio admin will appoint an available designer for you.'
                : ' No times are open.'}
            </p>
          ) : null}

          {selectedDateSlots.length > 0 ? (
            <div className="slot-list">
              {selectedDateSlots.map(slot => {
                const isActive = slot === selectedSlot;

                return (
                  <div key={slot} className={`slot-row ${isActive ? 'active' : ''}`}>
                    <button
                      type="button"
                      className={`slot-button ${isActive ? 'active' : ''}`}
                      onClick={() => this.props.onSelectSlot?.(slot)}
                    >
                      {timeFormatter.format(new Date(slot))}
                    </button>
                    {renderSlotActions ? (
                      <div className="slot-actions">
                        {renderSlotActions(slot)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            selectedDateKey && packedDates.includes(selectedDateKey)
              ? null
              : <p className="calendar-empty-day">Select a highlighted date to view its time slots.</p>
          )}
        </div>

        {packedDates.length > 0 ? (
          <div className="calendar-legend">
            <span className="legend-item open">Open</span>
            <span className="legend-item packed">Packed</span>
            <span className="legend-item none">Unavailable</span>
          </div>
        ) : null}
      </div>
    );
  }
}

export default AvailabilityCalendar;
