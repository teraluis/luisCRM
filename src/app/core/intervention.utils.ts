

export function generateInterventionId(): string {
    let name = 'M';
    for (let i = 0; i < 7; i++) {
      const rand = Math.floor(Math.random() * 10);
      name = name + rand.toString();
    }

    return name;
  }
