import cv2
from matplotlib import pyplot as plt

img = cv2.imread('image.jpg', cv2.IMREAD_COLOR)
bi = cv2.bilateralFilter(img, 15, 20, 20)
bi2 = cv2.bilateralFilter(bi, 15, 20, 20)
bi3 = cv2.bilateralFilter(bi2, 15, 20, 20)

plt.subplot(2,2,1),plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
plt.title("original")
plt.xticks([]),plt.yticks([])
plt.subplot(2,2,2),plt.imshow(cv2.cvtColor(bi, cv2.COLOR_BGR2RGB))
plt.title("bi")
plt.xticks([]),plt.yticks([])
plt.subplot(2,2,3),plt.imshow(cv2.cvtColor(bi2, cv2.COLOR_BGR2RGB))
plt.title("bi2")
plt.xticks([]),plt.yticks([])
plt.subplot(2,2,4),plt.imshow(cv2.cvtColor(bi3, cv2.COLOR_BGR2RGB))
plt.title("bi3")
plt.xticks([]),plt.yticks([])

cv2.imwrite('out.jpg', bi)

plt.show()
