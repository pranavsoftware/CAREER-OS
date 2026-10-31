/**
 * Utility for parsing and managing call time status, countdowns, and locking rules.
 */

export function parseMeetingDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    // Expected format: dateStr = "YYYY-MM-DD", timeStr = "HH:mm" (24h)
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (!year || !month || !day) {
      // Fallback to ISO-standard Date parser for Safari / WebKit compatibility
      const isoFormatted = dateStr.includes('T') ? dateStr : `${dateStr}T${timeStr.includes(':') ? timeStr : timeStr + ':00'}`;
      const d = new Date(isoFormatted);
      return isNaN(d.getTime()) ? null : d;
    }
    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  } catch (err) {
    console.warn('Error parsing meeting date/time:', err);
    return null;
  }
}

/**
 * Returns time status for an interview:
 * - isUpcoming: current time is before meeting start
 * - isLive: current time is between start and end
 * - isPast: current time is after meeting end
 * - canJoin: true if time has come (or forceUnlock is enabled)
 * - countdownText: e.g. "02h 15m 30s" or "Live now"
 * - remainingMs: milliseconds until start (or until end if live)
 */
export function getCallTimeStatus(interview, currentTime = new Date(), forceUnlock = false) {
  if (!interview) {
    return {
      canJoin: false,
      isUpcoming: false,
      isLive: false,
      isPast: false,
      countdownText: '',
      statusLabel: 'Unknown',
      formattedStartTime: '',
    };
  }

  // If already completed in DB
  if (interview.status === 'Completed') {
    return {
      canJoin: true, // can review completed room
      isUpcoming: false,
      isLive: false,
      isPast: true,
      countdownText: 'Round Completed',
      statusLabel: 'Completed',
      statusVariant: 'completed',
      formattedStartTime: `${interview.date} at ${interview.time}`,
    };
  }

  const startDate = parseMeetingDateTime(interview.date, interview.time);
  if (!startDate) {
    return {
      canJoin: true,
      isUpcoming: false,
      isLive: true,
      isPast: false,
      countdownText: 'Ready',
      statusLabel: 'Ready to Join',
      statusVariant: 'live',
      formattedStartTime: `${interview.date} ${interview.time}`,
    };
  }

  const durationMins = interview.duration || 45;
  const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
  const nowMs = currentTime.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // If demo force unlock is active
  if (forceUnlock) {
    return {
      canJoin: true,
      isUpcoming: false,
      isLive: true,
      isPast: false,
      countdownText: 'Force Unlocked (Demo Mode)',
      statusLabel: 'Unlocked (Demo)',
      statusVariant: 'live',
      formattedStartTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startsInMs: 0,
    };
  }

  // Case 1: Before start time -> BUTTON MUST BE DISABLED
  if (nowMs < startMs) {
    const diffMs = startMs - nowMs;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    let countdown = '';
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      countdown = `Starts in ${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      countdown = `Starts in ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    } else {
      countdown = `Starts in ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }

    return {
      canJoin: false, // STRICTLY DISABLED UNTIL TIME COMES
      isUpcoming: true,
      isLive: false,
      isPast: false,
      startsInMs: diffMs,
      countdownText: countdown,
      statusLabel: 'Scheduled (Locked)',
      statusVariant: 'locked',
      formattedStartTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lockReason: `Button will unlock automatically at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${interview.date})`,
    };
  }

  // Case 2: During call window -> BUTTON ENABLED (LIVE NOW)
  if (nowMs >= startMs && nowMs <= endMs) {
    const remainingMs = endMs - nowMs;
    const mins = Math.floor(remainingMs / (1000 * 60));
    const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return {
      canJoin: true,
      isUpcoming: false,
      isLive: true,
      isPast: false,
      countdownText: `Call is LIVE • ${mins}m ${secs}s remaining`,
      statusLabel: 'Live Now',
      statusVariant: 'live',
      formattedStartTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // Case 3: After call window has passed
  return {
    canJoin: true, // can revisit ended room or view notes
    isUpcoming: false,
    isLive: false,
    isPast: true,
    countdownText: 'Call Ended',
    statusLabel: 'Call Ended',
    statusVariant: 'past',
    formattedStartTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
