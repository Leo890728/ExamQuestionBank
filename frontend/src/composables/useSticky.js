import { ref, onMounted, onBeforeUnmount } from "vue";

export function useSticky(targetRef) {
  const isSticky = ref(false);
  let observer;

  onMounted(() => {
    observer = new IntersectionObserver(
      ([entry]) => {
        isSticky.value = !entry.isIntersecting;
      },
      { threshold: 0 }
    );

    if (targetRef.value) {
      observer.observe(targetRef.value);
    }
  });

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
  });

  return { isSticky };
}