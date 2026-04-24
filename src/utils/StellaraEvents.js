class StellaraEvents {
  constructor() {
    this.events = {};
  }

  on(name, fn) {
    if (!this.events[name]) this.events[name] = [];
    this.events[name].push(fn);
    // Unsubscribe 함수 반환
    return () => {
      this.events[name] = this.events[name].filter(f => f !== fn);
    };
  }

  emit(name, data) {
    if (this.events[name]) {
      this.events[name].forEach(fn => fn(data));
    }
  }
}

export const events = new StellaraEvents();
