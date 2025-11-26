export const pairwise = (
  arr: number[],
  func: (current: number, next: number, index: number) => void
) => {
  let cnt = 0;
  for (let i = 0; i < arr.length - 1; i += 2) {
    func(arr[i]!, arr[i + 1]!, cnt);
    cnt += 1;
  }
};
