export const parseInput = (input: string, isText: boolean, debug: boolean) => {
  let buffer: string|any[]
  if(isText) {
    buffer = input;
  } else {
    buffer = []
    for (let s of input.split(" ")) {
      if (s.includes("0x")) {
        s = s.replace("0x", "");
        buffer.push(parseInt(s, 16))
      } else {
        buffer.push(parseInt(s))
      }
    }
  }

  if(debug) {
    console.log("TX: " + buffer);
  }

  return buffer;
}
